import * as THREE from 'three';
// @ts-ignore
import { WebGPURenderer } from 'three/webgpu';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { AvatarLoader } from './AvatarLoader';
import { StageLoader } from './StageLoader';
import { AnimationController } from './AnimationController';
import { LookAtProcessor } from './LookAtProcessor';
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

  // Components
  private lookAtProcessor: LookAtProcessor;
  private currentAvatarConfig: AvatarConfig | null = null;

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

    // 6. Initialize Processor
    this.lookAtProcessor = new LookAtProcessor(
      this.container,
      this.camera,
      () => this.headBone,
      () => this.currentAvatarConfig,
      () => {
        const list = [];
        if (this.avatarModel) list.push(this.avatarModel);
        if (this.stageModel) list.push(this.stageModel);
        return list;
      }
    );

    // 7. Event Handlers
    window.addEventListener('resize', this.onWindowResize.bind(this));

    // Start Loop (WebGPU Style)
    this.renderer.setAnimationLoop(this.animate.bind(this));
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

    // Cache head bone
    const headName = config.lookAt?.headBoneName || 'Head';
    this.headBone = this.avatarModel.getObjectByName(headName) || null;
    if (!this.headBone) {
      this.avatarModel.traverse(c => { if (!this.headBone && c.name.toLowerCase().includes('head')) this.headBone = c; });
    }
    
    // Initialize Animation Controller
    if (animations.length > 0) {
      this.animController = new AnimationController(this.avatarModel, animations);
      const animConfig = config.animations || {
        defaultState: 'idle',
        states: {
          idle: { clipName: 'Idle', loop: true },
          wave: { clipName: 'Wave', loop: false, next: 'idle' },
          dance: { clipName: 'Dance', loop: false, next: 'idle' },
          bow: { clipName: 'Bow', loop: false, next: 'idle' }
        }
      };
      this.animController.init(animConfig);
    }
    
    console.log(`[Flow] Avatar "${config.name}" loaded.`);
  }

  /**
   * Load a stage (podium/scene) by config URL
   */
  async loadStage(configUrl: string) {
    if (this.stageModel) this.scene.remove(this.stageModel);
    const { model, config, animations } = await this.stageLoader.load(configUrl);
    this.stageModel = model;
    this.scene.add(this.stageModel);

    if (animations.length > 0 && config.animations) {
      this.stageAnimController = new AnimationController(this.stageModel, animations);
      this.stageAnimController.init(config.animations);
    }
  }

  public setDebug(enabled: boolean) {
    this.isDebug = enabled;
    if (enabled) this.createDebugHelpers();
    else this.removeDebugHelpers();
  }

  private createDebugHelpers() {
    if (!this.debugTargetMesh) {
      this.debugTargetMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true, depthTest: false })
      );
      this.debugTargetMesh.renderOrder = 999;
      this.scene.add(this.debugTargetMesh);
    }
    if (!this.debugPlaneMesh) {
      // Larger and more visible grid
      const grid = new THREE.GridHelper(100, 100, 0x00ff00, 0x008800);
      (grid.material as THREE.Material).transparent = true;
      (grid.material as THREE.Material).opacity = 0.5; // High visibility
      grid.rotateX(Math.PI / 2);
      this.debugPlaneMesh = grid as any;
      if (this.debugPlaneMesh) this.scene.add(this.debugPlaneMesh);
    }
  }

  private updateDebugHelpers() {
    if (!this.isDebug || !this.lookAtProcessor) return;

    const info = this.lookAtProcessor.getDebugInfo();
    
    // Target ball visible only when actually looking
    if (this.debugTargetMesh) {
      this.debugTargetMesh.position.copy(info.currentLookAt);
      this.debugTargetMesh.visible = info.isEngaged;
    }

    // Grid visible whenever Debug is ON and we have a plane
    if (this.debugPlaneMesh) {
      this.debugPlaneMesh.visible = true; // Always show if Debug is enabled
      
      // POSITION: Match the center of the active plane
      // Use the explicit visual center calculated by the processor
      if (info.planeCenter) {
         this.debugPlaneMesh.position.copy(info.planeCenter);
      } else {
         // Fallback if not initialized
         info.activePlane.projectPoint(new THREE.Vector3(0, 1.5, 0), this.debugPlaneMesh.position);
      }
      
      // ROTATION: Match the plane normal
      const normal = info.activePlane.normal;
      const targetPos = this.debugPlaneMesh.position.clone().add(normal);
      this.debugPlaneMesh.lookAt(targetPos);
      this.debugPlaneMesh.rotateX(Math.PI / 2);
    }
  }

  private removeDebugHelpers() {
    if (this.debugTargetMesh) { this.scene.remove(this.debugTargetMesh); this.debugTargetMesh = null; }
    if (this.debugPlaneMesh) { this.scene.remove(this.debugPlaneMesh); this.debugPlaneMesh = null; }
  }

  private onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  public isAutoRotate = false;

  public playAction(action: string) {
    this.lookAtProcessor.interrupt();
    if (this.animController) this.animController.play(action.toLowerCase());
  }

  private animate(timeMs: number) {
    const delta = this.clock.getDelta();
    if (this.avatarModel) {
       if (this.animController) this.animController.update(delta);
       this.lookAtProcessor.update(timeMs, delta);
    }
    this.updateDebugHelpers();
    if (this.stageModel && this.stageAnimController) this.stageAnimController.update(delta);
    this.controls.autoRotate = this.isAutoRotate;
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}
