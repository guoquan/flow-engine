import * as THREE from 'three';
// @ts-ignore
import { WebGPURenderer } from 'three/webgpu';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { AvatarLoader } from './AvatarLoader';
import { StageLoader } from './StageLoader';
import { AnimationController } from './AnimationController';
import type { AvatarConfig } from '../types';

export class FlowEngine {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: WebGPURenderer;
  private controls: OrbitControls;
  private clock: THREE.Clock;
  private loader: AvatarLoader;
  private stageLoader: StageLoader;
  
  private avatarModel: THREE.Object3D | null = null;
  private stageModel: THREE.Object3D | null = null;
  private headBone: THREE.Object3D | null = null;
  
  private animController: AnimationController | null = null;
  private stageAnimController: AnimationController | null = null;

  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  private isPointerDown = false; 
  
  private lookAtTarget = new THREE.Vector3();
  private currentLookAt = new THREE.Vector3(0, 1.5, 5);
  
  private lookAtWeight = 0; // Current blended weight
  private targetWeight = 0; // Target weight (0 or 1)
  private holdTimer: number | null = null;
  private lastTimeMs = 0;
  
  private currentAvatarConfig: AvatarConfig | null = null;
  private activePlane = new THREE.Plane(); 
  private lookAtProxy = new THREE.Object3D(); 

  // Debug Helpers
  public isDebug = false;
  private debugTargetMesh: THREE.Mesh | null = null;
  private debugPlaneMesh: THREE.Mesh | null = null;

  constructor(containerId: string) {
    const container = document.getElementById(containerId);
    if (!container) throw new Error(`Container #${containerId} not found`);
    this.container = container;
    
    // Init Logic
    this.clock = new THREE.Clock();
    this.loader = new AvatarLoader();
    this.stageLoader = new StageLoader();

    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a1a);
    this.scene.fog = new THREE.Fog(0x1a1a1a, 10, 50);

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(
      45, 
      window.innerWidth / window.innerHeight, 
      0.1, 
      100
    );
    this.camera.position.set(0, 1.5, 5);

    // 3. Renderer (WebGPU)
    this.renderer = new WebGPURenderer({ antialias: true, alpha: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.container.appendChild(this.renderer.domElement);

    // 4. Lights
    this.setupLights();

    // 5. Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.target.set(0, 1, 0);

    // 6. Event Handlers
    window.addEventListener('resize', this.onWindowResize.bind(this));
    this.container.addEventListener('pointerdown', this.onPointerDown.bind(this));
    this.container.addEventListener('pointermove', this.onPointerMove.bind(this));
    window.addEventListener('pointerup', this.onPointerUp.bind(this));

    // Start Loop (WebGPU Style)
    this.renderer.setAnimationLoop(this.animate.bind(this));
  }

  private updateMousePosition(event: PointerEvent) {
    const rect = this.container.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  private onPointerDown(event: PointerEvent) {
    this.isPointerDown = true;
    this.targetWeight = 1.0; // Engagement started
    this.holdTimer = null; // Clear timer
    this.updateMousePosition(event);
    
    // 1. Establish the "Midway Plane" at the moment of click
    this.camera.updateMatrixWorld();
    const headPos = new THREE.Vector3(0, 1.5, 0);
    if (this.headBone) this.headBone.getWorldPosition(headPos);
    const camPos = this.camera.position.clone();
    
    // Position exactly halfway between head and camera
    const midPoint = new THREE.Vector3().lerpVectors(headPos, camPos, 0.5);
    const normal = new THREE.Vector3().subVectors(camPos, headPos).normalize();
    this.activePlane.setFromNormalAndCoplanarPoint(normal, midPoint);

    // 2. Lock the Debug Grid to this plane
    if (this.debugPlaneMesh) {
      this.debugPlaneMesh.position.copy(midPoint);
      this.debugPlaneMesh.lookAt(camPos);
      this.debugPlaneMesh.rotateX(Math.PI / 2);
    }
    
    console.log(`[Flow] Interaction Session Started: TargetWeight=1.0`);
  }

  private onPointerMove(event: PointerEvent) {
    if (this.isPointerDown) {
      this.updateMousePosition(event);
    }
  }

  private onPointerUp() {
    if (this.isPointerDown) {
      this.isPointerDown = false;
      // Start the hold timer before we drop targetWeight to 0
      this.holdTimer = this.lastTimeMs;
      console.log(`[Flow] Pointer Up: Waiting to release...`);
    }
  }

  private calculateLookAtTarget() {
    this.raycaster.setFromCamera(this.mouse, this.camera);

    // 1. Try to hit actual 3D objects
    const targets = [];
    if (this.avatarModel) targets.push(this.avatarModel);
    if (this.stageModel) targets.push(this.stageModel);
    
    const intersects = this.raycaster.intersectObjects(targets, true);

    if (intersects.length > 0) {
      this.lookAtTarget.copy(intersects[0].point);
    } else {
      // 2. Use the LOCKED Midway Plane
      const intersectionPoint = new THREE.Vector3();
      if (this.raycaster.ray.intersectPlane(this.activePlane, intersectionPoint)) {
        this.lookAtTarget.copy(intersectionPoint);
      } else {
        // Absolute fallback
        this.lookAtTarget.copy(this.raycaster.ray.direction).multiplyScalar(3).add(this.camera.position);
      }
    }
  }

  private setupLights() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(5, 10, 7);
    dirLight.castShadow = true;
    this.scene.add(dirLight);

    // Rim light for cool effect
    const spotLight = new THREE.SpotLight(0x00d2ff, 5);
    spotLight.position.set(-5, 5, -5);
    spotLight.lookAt(0, 1, 0);
    this.scene.add(spotLight);
  }

  /**
   * Load an avatar by config URL
   */
  async loadAvatar(configUrl: string) {
    if (this.avatarModel) {
      this.scene.remove(this.avatarModel);
    }

    const { model, config, animations } = await this.loader.load(configUrl);
    this.avatarModel = model;
    this.currentAvatarConfig = config;
    this.scene.add(this.avatarModel);

    // Find and cache the Head bone
    const headName = config.lookAt?.headBoneName || 'Head';
    this.headBone = this.avatarModel.getObjectByName(headName) || null;
    if (!this.headBone) {
      this.avatarModel.traverse(child => {
        if (this.headBone) return;
        const lowerName = child.name.toLowerCase();
        if (lowerName.includes('head') || lowerName.includes('neck')) {
          this.headBone = child;
        }
      });
    }
    
    // Initialize Animation Controller
    if (animations.length > 0) {
      this.animController = new AnimationController(this.avatarModel, animations);
      
      // Use config if available, otherwise generate default map
      const animConfig = config.animations || {
        defaultState: 'idle',
        states: {
          idle: { clipName: 'Idle', loop: true },
          wave: { clipName: 'Wave', loop: false, next: 'idle' },
          dance: { clipName: 'Dance', loop: false, next: 'idle' },
          bow: { clipName: 'Bow', loop: false, next: 'idle' },
          walk: { clipName: 'Walking', loop: true }
        }
      };
      
      this.animController.init(animConfig);
    }
    
    console.log(`[Flow] Avatar "${config.name}" loaded successfully.`);
  }

  /**
   * Load a stage (podium/scene) by config URL
   */
  async loadStage(configUrl: string) {
    if (this.stageModel) {
      this.scene.remove(this.stageModel);
    }

    const { model, config, animations } = await this.stageLoader.load(configUrl);
    this.stageModel = model;
    this.scene.add(this.stageModel);

    // Initialize Stage Animation Controller (if stage has animations)
    if (animations.length > 0 && config.animations) {
      this.stageAnimController = new AnimationController(this.stageModel, animations);
      this.stageAnimController.init(config.animations);
    }

    console.log(`[Flow] Stage "${config.name}" loaded successfully.`);
  }

  /**
   * Toggle debug helpers
   */
  public setDebug(enabled: boolean) {
    this.isDebug = enabled;
    console.log(`[Flow] Debug Mode: ${enabled}`);

    if (enabled) {
      this.createDebugHelpers();
    } else {
      this.removeDebugHelpers();
    }
  }

  private createDebugHelpers() {
    if (!this.debugTargetMesh) {
      const geo = new THREE.SphereGeometry(0.1, 8, 8);
      const mat = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true, depthTest: false, transparent: true, opacity: 0.8 });
      this.debugTargetMesh = new THREE.Mesh(geo, mat);
      this.debugTargetMesh.renderOrder = 999;
      this.scene.add(this.debugTargetMesh);
    }

    if (!this.debugPlaneMesh) {
      // Very dense grid to create a visible 'surface' texture
      const size = 100;
      const divisions = 400; // Increased from 100
      const grid = new THREE.GridHelper(size, divisions, 0x00ff00, 0x00ff00);
      grid.material.transparent = true;
      grid.material.opacity = 0.05; // Fainter but more uniform
      
      grid.rotateX(Math.PI / 2);
      this.debugPlaneMesh = grid as any;
      this.scene.add(this.debugPlaneMesh);
    }
  }

  private updateDebugHelpers() {
    if (!this.isDebug) return;

    const isVisible = (this.lookAtWeight > 0.001);

    if (this.debugTargetMesh) {
      this.debugTargetMesh.position.copy(this.currentLookAt);
      this.debugTargetMesh.visible = isVisible;
    }

    if (this.debugPlaneMesh) {
      this.debugPlaneMesh.visible = isVisible;
    }

    if (this.debugTargetMesh) this.debugTargetMesh.renderOrder = 1000;
  }

  private removeDebugHelpers() {
    if (this.debugTargetMesh) {
      this.scene.remove(this.debugTargetMesh);
      this.debugTargetMesh = null;
    }
    if (this.debugPlaneMesh) {
      this.scene.remove(this.debugPlaneMesh);
      this.debugPlaneMesh = null;
    }
  }

  private onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  // State
  public isAutoRotate = false;

  /**
   * Play a specific action
   */
  public playAction(action: string) {
    console.log(`[FlowEngine] Playing action: ${action}`);

    // Priority 0: Smoothly drop LookAt influence
    this.targetWeight = 0;
    this.isPointerDown = false;
    this.holdTimer = null;

    // Priority 1: Animation Controller
    if (this.animController) {
      // Lowercase to match state keys if we used loose keys
      this.animController.play(action.toLowerCase());
      return;
    }

    // Priority 2: Procedural Animation (Fallback Model - removed for clarity, or kept minimal)
  }

  private animate(timeMs: number) {
    this.lastTimeMs = timeMs;
    const delta = this.clock.getDelta();
    
    if (this.avatarModel) {
       // Mixer Update
       if (this.animController) {
         this.animController.update(delta);
       }

       // Head Tracking (Manual override after animation update)
       if (this.headBone && this.currentAvatarConfig?.lookAt?.enabled !== false) {
         const config = this.currentAvatarConfig?.lookAt;
         const lerpFactor = config?.lerpFactor ?? 0.1;
         const holdTime = config?.holdDuration ?? 2000;

         // 1. Timer Logic (Set targetWeight to 0 after hold time)
         if (!this.isPointerDown && this.holdTimer && timeMs - this.holdTimer > holdTime) {
           this.targetWeight = 0;
           this.holdTimer = null;
         }

         // 2. Easing: Interpolate weight towards target
         this.lookAtWeight = THREE.MathUtils.lerp(this.lookAtWeight, this.targetWeight, 0.05);

         // 3. Update target tracking only when engaging
         if (this.targetWeight > 0) {
           this.calculateLookAtTarget();
           this.currentLookAt.lerp(this.lookAtTarget, lerpFactor);
         }

         // 4. Apply Rotation with Quaternion Blending
         if (this.lookAtWeight > 0.001) {
           const headWorldPos = new THREE.Vector3();
           this.headBone.getWorldPosition(headWorldPos);
           this.lookAtProxy.position.copy(headWorldPos);
           
           this.lookAtProxy.lookAt(this.currentLookAt);
           
           const offsetQuat = new THREE.Quaternion();
           if (config?.rotationOffset) {
             offsetQuat.setFromEuler(new THREE.Euler(...config.rotationOffset));
           } else {
             offsetQuat.setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0));
           }
           
           const targetQuat = this.lookAtProxy.quaternion.clone().multiply(offsetQuat);
           this.headBone.quaternion.slerp(targetQuat, this.lookAtWeight);
         }
       }
    }

    this.updateDebugHelpers();

    if (this.stageModel && this.stageAnimController) {
      this.stageAnimController.update(delta);
    }

    // Auto Rotate Camera (Optional)
    this.controls.autoRotate = this.isAutoRotate;
    this.controls.update();
    
    this.renderer.render(this.scene, this.camera);
  }
}
