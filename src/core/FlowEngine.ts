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

  // Interaction State
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  
  private lookAtTarget = new THREE.Vector3();
  private defaultLookAt = new THREE.Vector3(0, 1.5, 5);
  private currentLookAt = new THREE.Vector3(0, 1.5, 5);
  
  private lookAtState: 'IDLE' | 'LOOKING' | 'HOLDING' | 'RETURNING' = 'IDLE';
  private lookAtTimer = 0;
  private currentAvatarConfig: AvatarConfig | null = null;

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

    // Start Loop (WebGPU Style)
    this.renderer.setAnimationLoop(this.animate.bind(this));
  }

  private onPointerDown(event: PointerEvent) {
    const rect = this.container.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    // 1. Try to hit actual 3D objects (Stage or Avatar)
    const targets = [];
    if (this.avatarModel) targets.push(this.avatarModel);
    if (this.stageModel) targets.push(this.stageModel);
    
    const intersects = this.raycaster.intersectObjects(targets, true);

    if (intersects.length > 0) {
      // Hit an object! Look at the exact point on its surface.
      this.lookAtTarget.copy(intersects[0].point);
      console.log(`[Flow] Hit Object: ${intersects[0].object.name} at`, this.lookAtTarget);
    } else {
      // 2. Fallback: Project onto a sphere around the avatar
      // This allows looking left, right, up, down and even slightly behind
      const sphere = new THREE.Sphere(new THREE.Vector3(0, 1.5, 0), 3);
      const intersectionPoint = new THREE.Vector3();
      
      if (this.raycaster.ray.intersectSphere(sphere, intersectionPoint)) {
        this.lookAtTarget.copy(intersectionPoint);
        console.log(`[Flow] Hit Interaction Sphere at`, this.lookAtTarget);
      } else {
        // If ray misses the sphere (pointing away), just look at the ray direction at a distance
        this.lookAtTarget.copy(this.raycaster.ray.direction).multiplyScalar(3).add(this.camera.position);
      }
    }

    this.lookAtState = 'LOOKING';
    this.lookAtTimer = Date.now();
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

    // Priority 0: Smoothly interrupt LookAt
    if (this.lookAtState !== 'IDLE') {
      this.lookAtState = 'RETURNING'; // Change from IDLE to RETURNING for smoothness
    }

    // Priority 1: Animation Controller
    if (this.animController) {
      // Lowercase to match state keys if we used loose keys
      this.animController.play(action.toLowerCase());
      return;
    }

    // Priority 2: Procedural Animation (Fallback Model - removed for clarity, or kept minimal)
  }

  private animate(_timeMs: number) {
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

         // State Management
         if (this.lookAtState === 'LOOKING') {
           this.currentLookAt.lerp(this.lookAtTarget, lerpFactor);
           if (this.currentLookAt.distanceTo(this.lookAtTarget) < 0.01) {
             this.lookAtState = 'HOLDING';
             this.lookAtTimer = Date.now();
           }
         } else if (this.lookAtState === 'HOLDING') {
           if (Date.now() - this.lookAtTimer > holdTime) {
             this.lookAtState = 'RETURNING';
           }
         } else if (this.lookAtState === 'RETURNING') {
           this.currentLookAt.lerp(this.defaultLookAt, lerpFactor);
           if (this.currentLookAt.distanceTo(this.defaultLookAt) < 0.01) {
             this.lookAtState = 'IDLE';
           }
         }

         // Apply Rotation
         if (this.lookAtState !== 'IDLE') {
           this.headBone.lookAt(this.currentLookAt);
           if (config?.rotationOffset) {
             this.headBone.rotateX(config.rotationOffset[0]);
             this.headBone.rotateY(config.rotationOffset[1]);
             this.headBone.rotateZ(config.rotationOffset[2]);
           } else {
             // Default Fallback
             this.headBone.rotateX(Math.PI / 2);
           }
         }
       }
    }

    if (this.stageModel && this.stageAnimController) {
      this.stageAnimController.update(delta);
    }

    // Auto Rotate Camera (Optional)
    this.controls.autoRotate = this.isAutoRotate;
    this.controls.update();
    
    this.renderer.render(this.scene, this.camera);
  }
}
