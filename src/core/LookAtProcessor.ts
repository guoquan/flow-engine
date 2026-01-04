import * as THREE from 'three';
import type { InteractionProcessor, AvatarConfig } from '../types';

const LookAtState = {
  IDLE: 'IDLE',
  TRACKING: 'TRACKING',
  HOLDING: 'HOLDING',
  OVERRIDE: 'OVERRIDE'
} as const;
type LookAtState = typeof LookAtState[keyof typeof LookAtState];

// Default Constants
const DEFAULT_DAMPING = 5.0;
const VIRTUAL_PLANE_OFFSET = 1.5;
const NORMAL_THRESHOLD = Number.EPSILON;

export class LookAtProcessor implements InteractionProcessor {
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  
  // State Machine
  private state: LookAtState = LookAtState.IDLE;
  private stateTimer = 0;

  // Core Data
  private lookAtTarget = new THREE.Vector3(); // Desired World Target
  private currentLookAt = new THREE.Vector3(); // Smoothed World Target (For debug visualization)
  private activePlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -2.5);
  private planeCenter = new THREE.Vector3(0, 1.5, 2.5); // Visual center of the plane
  
  // Physics / Math Helpers
  private lookAtProxy = new THREE.Object3D();
  
  // Reusable temporaries to reduce GC
  private _targetQuat = new THREE.Quaternion();
  private _dummyVec = new THREE.Vector3();
  private _offsetQuat = new THREE.Quaternion();
  private _parentWorldQuat = new THREE.Quaternion();
  
  // V6 Architecture: Persistent State Tracker
  private outputQuaternion: THREE.Quaternion | null = null;
  private weight = 0; // Legacy debug value

  // Dependencies
  private container: HTMLElement;
  private camera: THREE.Camera;
  private getHeadBone: () => THREE.Object3D | null;
  private getConfig: () => AvatarConfig | null;
  private getModels: () => THREE.Object3D[];

  // Bound event handlers
  private boundOnPointerDown: (e: PointerEvent) => void;
  private boundOnPointerMove: (e: PointerEvent) => void;
  private boundOnPointerUp: (e: PointerEvent) => void;

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

    this.boundOnPointerDown = this.onPointerDown.bind(this);
    this.boundOnPointerMove = this.onPointerMove.bind(this);
    this.boundOnPointerUp = this.onPointerUp.bind(this);

    this.container.addEventListener('pointerdown', this.boundOnPointerDown);
    this.container.addEventListener('pointermove', this.boundOnPointerMove);
    window.addEventListener('pointerup', this.boundOnPointerUp);
  }

  public update(timeMs: number, delta: number) {
    const headBone = this.getHeadBone();
    const config = this.getConfig();
    if (!headBone || !config || config.lookAt?.enabled === false) return;

    // --- 1. Capture Base Animation State ---
    const animationQuat = headBone.quaternion.clone();

    if (!this.outputQuaternion) {
      this.outputQuaternion = animationQuat.clone();
    }

    // --- 2. State Machine Update ---
    this.updateState(timeMs, config);

    // --- 3. Determine the "Virtual Target" (Instantaneous Goal) ---
    const isInteracting = (this.state !== LookAtState.IDLE);
    
    if (isInteracting) {
      // GOAL: Look at the target point
      this.calculateLookAtRotation(headBone, config, this._targetQuat);
      this.weight = 1;
    } else {
      // GOAL: Follow the animation
      this._targetQuat.copy(animationQuat);
      this.weight = 0;
    }

    // --- 4. The Smoothing (The "Entity" chasing the "Virtual Target") ---
    const damping = config.lookAt?.damping ?? DEFAULT_DAMPING;
    const alpha = 1 - Math.exp(-damping * delta);
    this.outputQuaternion.slerp(this._targetQuat, alpha);

    // --- 5. Apply Final Result ---
    headBone.quaternion.copy(this.outputQuaternion);

    // Update debug helper vector only if needed
    if (isInteracting) {
        this.currentLookAt.lerp(this.lookAtTarget, alpha);
    }
  }

  private calculateLookAtRotation(headBone: THREE.Object3D, config: AvatarConfig, targetQuat: THREE.Quaternion) {
    const headWorldPos = this._dummyVec;
    headBone.getWorldPosition(headWorldPos);

    this.lookAtProxy.position.copy(headWorldPos);
    this.lookAtProxy.lookAt(this.lookAtTarget);
    this.lookAtProxy.updateMatrixWorld(); 
    
    const rotOffset = config.lookAt?.rotationOffset || [0, 0, 0];
    this._offsetQuat.setFromEuler(new THREE.Euler(...rotOffset));
    
    const targetWorldQuat = this.lookAtProxy.quaternion.multiply(this._offsetQuat);

    const parent = headBone.parent;
    if (parent) {
      parent.getWorldQuaternion(this._parentWorldQuat);
      const invParentQuat = this._parentWorldQuat.invert();
      targetQuat.copy(invParentQuat.multiply(targetWorldQuat));
    } else {
      targetQuat.copy(targetWorldQuat);
    }
  }

  private updateState(timeMs: number, config: AvatarConfig) {
    const holdDuration = config.lookAt?.holdDuration ?? 2000;

    switch (this.state) {
      case LookAtState.TRACKING:
        this.calculateLookAtTarget(); 
        break;

      case LookAtState.HOLDING:
        if (timeMs - this.stateTimer > holdDuration) {
          this.state = LookAtState.IDLE;
          console.log('[Flow] LookAt: Holding finished, releasing to animation.');
        }
        break;
      
      case LookAtState.OVERRIDE:
        // Stay in override until manually reset or new interaction
        break;

      case LookAtState.IDLE:
        break;
    }
  }

  /**
   * Set a manual world-space target for the avatar to look at.
   */
  public setTarget(position: THREE.Vector3) {
    this.state = LookAtState.OVERRIDE;
    this.lookAtTarget.copy(position);
  }

  /**
   * Return the LookAt system to IDLE state.
   */
  public reset() {
    this.state = LookAtState.IDLE;
  }

  private onPointerDown(event: PointerEvent) {
    this.updateMouse(event);
    
    const headBone = this.getHeadBone();
    if (headBone) {
      const headPos = new THREE.Vector3();
      headBone.getWorldPosition(headPos);
      const camPos = this.camera.position.clone();
      
      // Determine Billboard Plane Normal (facing the camera)
      // This ensures the interaction plane is always perpendicular to the view direction.
      const toHead = new THREE.Vector3().subVectors(camPos, headPos);
      const forward = new THREE.Vector3();

      // Handle edge case where camera and head are at (nearly) the same position:
      // avoid normalizing a zero-length vector by falling back to the camera's
      // viewing direction (if available), or a fixed world direction.
      // Use a practical epsilon (1e-6) for numerical stability.
      if (toHead.lengthSq() < 1e-6) {
        const cameraWithDirection = this.camera as Partial<THREE.Camera>;
        if ('getWorldDirection' in cameraWithDirection && typeof cameraWithDirection.getWorldDirection === 'function') {
          cameraWithDirection.getWorldDirection(forward);
          // getWorldDirection returns the camera's forward (scene-facing) vector.
          // Negate it so the plane normal approximately points toward the camera.
          forward.negate();
        } else {
          // Fallback to a fixed direction if world direction is not available.
          forward.set(0, 0, 1);
        }
      } else {
        forward.copy(toHead).normalize();
      }
      
      // Place the fallback plane VIRTUAL_PLANE_OFFSET in front of the head
      // Note: Must clone forward to avoid modifying the normal vector itself
      const planeOffset = forward.clone().multiplyScalar(VIRTUAL_PLANE_OFFSET);
      this.planeCenter.copy(headPos).add(planeOffset);
      this.activePlane.setFromNormalAndCoplanarPoint(forward, this.planeCenter);
    }

    this.state = LookAtState.TRACKING;
    this.calculateLookAtTarget();
    
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

  private updateMouse(event: PointerEvent) {
    const rect = this.container.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  private calculateLookAtTarget() {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    const models = this.getModels().filter(m => !!m);
    
    if (models.length > 0) {
      const intersects = this.raycaster.intersectObjects(models, true);
      if (intersects.length > 0) {
        this.lookAtTarget.copy(intersects[0].point);
        return; 
      }
    }

    const target = this._dummyVec;
    if (this.activePlane.normal.lengthSq() > NORMAL_THRESHOLD) {
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
    this.container.removeEventListener('pointerdown', this.boundOnPointerDown);
    this.container.removeEventListener('pointermove', this.boundOnPointerMove);
    window.removeEventListener('pointerup', this.boundOnPointerUp);
  }
}