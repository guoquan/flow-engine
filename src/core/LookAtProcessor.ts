import * as THREE from 'three';
import type { InteractionProcessor, AvatarConfig } from '../types';

const LookAtState = {
  IDLE: 'IDLE',
  TRACKING: 'TRACKING',
  HOLDING: 'HOLDING',
  RETURNING: 'RETURNING'
} as const;
type LookAtState = typeof LookAtState[keyof typeof LookAtState];

export class LookAtProcessor implements InteractionProcessor {
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  
  // State Machine
  private state: LookAtState = LookAtState.IDLE;
  private stateTimer = 0;

  // Core Data
  private lookAtTarget = new THREE.Vector3(); // Desired World Target
  private currentLookAt = new THREE.Vector3(); // Smoothed World Target (Legacy helper for debug visualization)
  private activePlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -2.5);
  private planeCenter = new THREE.Vector3(0, 1.5, 2.5); // Visual center of the plane
  
  // Physics / Math Helpers
  private lookAtProxy = new THREE.Object3D();
  
  // V6 Architecture: Persistent State Tracker
  // The 'Real Entity' state that smoothly chases the target
  private outputQuaternion: THREE.Quaternion | null = null;
  private weight = 0; // Legacy debug value, kept for HUD

  // Dependencies
  private container: HTMLElement;
  private camera: THREE.Camera;
  private getHeadBone: () => THREE.Object3D | null;
  private getConfig: () => AvatarConfig | null;
  private getModels: () => THREE.Object3D[];

  constructor(
    container: HTMLElement,
    camera: THREE.Camera,
    getHeadBone: () => THREE.Object3D | null,
    getConfig: () => AvatarConfig | null,
    getModels: () => THREE.Object3D[]
  ) {
    this.container = container;
    this.camera = camera;
    this.getHeadBone = getHeadBone;
    this.getConfig = getConfig;
    this.getModels = getModels;

    this.container.addEventListener('pointerdown', this.onPointerDown.bind(this));
    this.container.addEventListener('pointermove', this.onPointerMove.bind(this));
    window.addEventListener('pointerup', this.onPointerUp.bind(this));
  }

  public update(timeMs: number, delta: number) {
    const headBone = this.getHeadBone();
    const config = this.getConfig();
    if (!headBone || !config || config.lookAt?.enabled === false) return;

    // --- 1. Capture Base Animation State ---
    // The AnimationMixer has already run this frame. 
    // This represents the "Natural" state of the bone (where it wants to be if we do nothing).
    const animationQuat = headBone.quaternion.clone();

    // Initialize outputQuaternion if first frame
    if (!this.outputQuaternion) {
      this.outputQuaternion = animationQuat.clone();
    }

    // --- 2. State Machine Update ---
    this.updateState(timeMs, delta, config);

    // --- 3. Determine the "Virtual Target" (Instantaneous Goal) ---
    const targetQuat = new THREE.Quaternion();
    
    // Logic: Who is in control?
    const isInteracting = (this.state === LookAtState.TRACKING || this.state === LookAtState.HOLDING);
    
    if (isInteracting) {
      // GOAL: Look at the target point
      // We calculate the exact rotation needed to look at 'lookAtTarget' right now.
      targetQuat.copy(this.calculateLookAtRotation(headBone, config));
      this.weight = 1; // Debug info
    } else {
      // GOAL: Follow the animation
      // The target is simply the animation's current frame rotation.
      targetQuat.copy(animationQuat);
      this.weight = 0; // Debug info
    }

    // --- 4. The Smoothing (The "Entity" chasing the "Virtual Target") ---
    // Use independent damping. 
    // A value of 5.0 - 10.0 gives a responsive but smooth "organic" feel.
    // Lower = heavier/sleepier. Higher = tighter/robotic.
    const damping = 5.0; 
    const alpha = 1 - Math.exp(-damping * delta);
    
    this.outputQuaternion.slerp(targetQuat, alpha);

    // --- 5. Apply Final Result ---
    // Overwrite the bone's rotation with our smoothed result.
    headBone.quaternion.copy(this.outputQuaternion);

    // Update debug helper vector (visual only now)
    if (isInteracting) {
        this.currentLookAt.lerp(this.lookAtTarget, alpha);
    }
  }

  // Calculate the Local Rotation needed to look at the target
  private calculateLookAtRotation(headBone: THREE.Object3D, config: AvatarConfig): THREE.Quaternion {
    const headWorldPos = new THREE.Vector3();
    headBone.getWorldPosition(headWorldPos);

    // 1. Proxy looks at target in World Space
    this.lookAtProxy.position.copy(headWorldPos);
    this.lookAtProxy.lookAt(this.lookAtTarget);
    
    // 2. Apply Offset
    const offsetQuat = new THREE.Quaternion();
    const rotOffset = config.lookAt?.rotationOffset || [0, 0, 0];
    offsetQuat.setFromEuler(new THREE.Euler(...rotOffset));
    
    const targetWorldQuat = this.lookAtProxy.quaternion.clone().multiply(offsetQuat);

    // 3. Convert to Local Space (relative to parent)
    const parent = headBone.parent;
    if (parent) {
      const parentWorldQuat = new THREE.Quaternion();
      parent.getWorldQuaternion(parentWorldQuat);
      const invParentQuat = parentWorldQuat.invert();
      return invParentQuat.multiply(targetWorldQuat);
    } else {
      return targetWorldQuat;
    }
  }

  private updateState(timeMs: number, _delta: number, config: AvatarConfig) {
    const holdDuration = config.lookAt?.holdDuration ?? 2000;

    switch (this.state) {
      case LookAtState.TRACKING:
        this.calculateLookAtTarget(); 
        break;

      case LookAtState.HOLDING:
        if (timeMs - this.stateTimer > holdDuration) {
          this.state = LookAtState.IDLE; // Direct transition to IDLE (Target becomes Animation)
          console.log('[Flow] LookAt: Holding finished, releasing to animation.');
        }
        break;
      
      case LookAtState.IDLE:
        break;
    }
  }

  // --- Input Handling ---

  private onPointerDown(event: PointerEvent) {
    this.updateMouse(event);
    
    // Initialize interaction plane (Fallback layer)
    const headBone = this.getHeadBone();
    if (headBone) {
      const headPos = new THREE.Vector3();
      headBone.getWorldPosition(headPos);
      const camPos = this.camera.position.clone();
      
      // LOGIC FIX: Place the fallback plane 1.5m in front of the head.
      // This creates a "Virtual Screen" in front of the avatar.
      const dirToCam = new THREE.Vector3().subVectors(camPos, headPos).normalize();
      
      // Plane passes 1.5m in front of head
      this.planeCenter.copy(headPos).add(dirToCam.multiplyScalar(1.5));
      this.activePlane.setFromNormalAndCoplanarPoint(dirToCam, this.planeCenter);
    }

    // Start Tracking
    this.state = LookAtState.TRACKING;
    
    // Initial Target Calculation
    this.calculateLookAtTarget();
    
    // Snap initial visual helper for debug consistency
    if (!this.outputQuaternion) {
        this.currentLookAt.copy(this.lookAtTarget);
    }
  }

  private onPointerMove(event: PointerEvent) {
    if (this.state === LookAtState.TRACKING) {
      this.updateMouse(event);
    }
  }

  private onPointerUp() {
    if (this.state === LookAtState.TRACKING) {
      this.state = LookAtState.HOLDING;
      this.stateTimer = performance.now(); 
    }
  }

  // --- Helpers ---

  private updateMouse(event: PointerEvent) {
    const rect = this.container.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  private calculateLookAtTarget() {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    // 1. First Pass: Check REAL objects (Avatar, Stage, Props)
    const models = this.getModels().filter(m => !!m); // Filter nulls
    
    if (models.length > 0) {
      const intersects = this.raycaster.intersectObjects(models, true);
      if (intersects.length > 0) {
        this.lookAtTarget.copy(intersects[0].point);
        return; // Early exit if we hit an object
      }
    }

    // 2. Second Pass: Raycast against the Fallback Plane (Virtual Void)
    const target = new THREE.Vector3();
    // Validate plane normal to avoid errors
    if (this.activePlane.normal.lengthSq() > 0.1) {
      if (this.raycaster.ray.intersectPlane(this.activePlane, target)) {
        this.lookAtTarget.copy(target);
      }
    }
  }

  public getDebugInfo() {
    return {
      isEngaged: this.state !== LookAtState.IDLE,
      currentLookAt: this.currentLookAt,
      activePlane: this.activePlane,
      planeCenter: this.planeCenter,
      weight: this.weight
    };
  }

  public interrupt() {
    this.state = LookAtState.IDLE;
  }

  public dispose() {
    this.container.removeEventListener('pointerdown', this.onPointerDown.bind(this));
    this.container.removeEventListener('pointermove', this.onPointerMove.bind(this));
    window.removeEventListener('pointerup', this.onPointerUp.bind(this));
  }
}