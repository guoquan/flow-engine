import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { AvatarLoader } from './AvatarLoader';
import { StageLoader } from './StageLoader';
import { AnimationController } from './AnimationController';
import { LookAtProcessor } from './LookAtProcessor';
import type { AvatarConfig } from '../types';

export class FlowEngine {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls | null = null;
  private clock: THREE.Clock;
  private loader: AvatarLoader;
  private stageLoader: StageLoader;
  
  private avatarModel: THREE.Object3D | null = null;
  private stageModel: THREE.Object3D | null = null;
  private headBone: THREE.Object3D | null = null;
  
  private animController: AnimationController | null = null;
  private stageAnimController: AnimationController | null = null;

  // Modualized Processors
  private lookAtProcessor: LookAtProcessor | null = null;
  private currentAvatarConfig: AvatarConfig | null = null;

  // Debug Helpers
  public isDebug = false;
  private debugTargetMesh: THREE.Mesh | null = null;
  private debugPlaneMesh: THREE.Mesh | null = null;

    constructor(containerId: string, overrides?: { 
      loader?: AvatarLoader, 
      stageLoader?: StageLoader,
      lookAtProcessor?: LookAtProcessor,
      controls?: OrbitControls
    }) {
      console.log('[Flow] Engine Init Start');
      const container = document.getElementById(containerId);
      if (!container) throw new Error(`Container #${containerId} not found`);
      this.container = container;
      
      // Init Logic with Dependency Injection support
      this.clock = new THREE.Clock();
      this.loader = overrides?.loader || new AvatarLoader();
      this.stageLoader = overrides?.stageLoader || new StageLoader();
  
      // 1. Scene
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0x1a1a1a);
      this.scene.fog = new THREE.Fog(0x1a1a1a, 10, 50);
  
      // 2. Camera
      this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
      this.camera.position.set(0, 1.5, 5);
  
      // 3. Renderer (Standard WebGL for now to fix white screen)
      this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.setPixelRatio(window.devicePixelRatio);
      this.container.appendChild(this.renderer.domElement);
  
      // 4. Lights
      this.setupLights();
  
      // 5. Controls
      this.controls = overrides?.controls || new OrbitControls(this.camera, this.renderer.domElement);
      if (this.controls) {
        this.controls.enableDamping = true;
        this.controls.target.set(0, 1, 0);
      }
  
      // 6. Interaction Processors
      this.lookAtProcessor = overrides?.lookAtProcessor || new LookAtProcessor(
        this.container,
        this.camera,
        () => this.headBone,
        () => this.currentAvatarConfig,
        () => {
          const models = [];
          if (this.avatarModel) models.push(this.avatarModel);
          if (this.stageModel) models.push(this.stageModel);
          return models;
        }
      );
  
      // 7. Events
      window.addEventListener('resize', this.onWindowResize.bind(this));
  
      // Start Loop (standard WebGL loop)
      this.animate(0);
      console.log('[Flow] Engine Init Success');
    }  private setupLights() {
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
      const size = 100;
      const divisions = 400;
      const grid = new THREE.GridHelper(size, divisions, 0x00ff00, 0x00ff00);
      grid.material.transparent = true;
      grid.material.opacity = 0.05;
      grid.rotateX(Math.PI / 2);
      this.debugPlaneMesh = grid as any;
      this.scene.add(this.debugPlaneMesh);
    }
  }

  private updateDebugHelpers() {
    if (!this.isDebug || !this.lookAtProcessor) return;

    const info = this.lookAtProcessor.getDebugInfo();
    const isVisible = info.isEngaged;

    if (this.debugTargetMesh) {
      this.debugTargetMesh.position.copy(info.currentLookAt);
      this.debugTargetMesh.visible = isVisible;
    }

    if (this.debugPlaneMesh) {
      this.debugPlaneMesh.visible = isVisible;
      this.debugPlaneMesh.position.copy(info.activePlane.coplanarPoint(new THREE.Vector3()));
      this.debugPlaneMesh.lookAt(this.camera.position);
      this.debugPlaneMesh.rotateX(Math.PI / 2);
    }
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

    // Interrupt interaction
    if (this.lookAtProcessor) this.lookAtProcessor.interrupt();

    // Priority 1: Animation Controller
    if (this.animController) {
      this.animController.play(action.toLowerCase());
      return;
    }
  }

  private animate(timeMs: number) {
    requestAnimationFrame(this.animate.bind(this));
    const delta = this.clock.getDelta();
    
    if (this.avatarModel) {
       // 1. Mixer Update
       if (this.animController) {
         this.animController.update(delta);
       }

       // 2. Interaction Processors Update
       if (this.lookAtProcessor) {
         this.lookAtProcessor.update(timeMs, delta);
       }
    }

    this.updateDebugHelpers();

    if (this.stageModel && this.stageAnimController) {
      this.stageAnimController.update(delta);
    }

    // Auto Rotate Camera (Optional)
    if (this.controls) {
      this.controls.autoRotate = this.isAutoRotate;
      this.controls.update();
    }
    
    if (this.renderer) {
      this.renderer.render(this.scene, this.camera);
    }
  }
}
