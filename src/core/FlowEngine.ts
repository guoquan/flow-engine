import * as THREE from 'three';
// @ts-ignore
import { WebGPURenderer } from 'three/webgpu';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { AvatarLoader } from './AvatarLoader';
import { StageLoader } from './StageLoader';
import { AnimationController } from './AnimationController';

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
  private lookAtTarget = new THREE.Vector3(0, 1.5, 5); // Default look forward
  private currentLookAt = new THREE.Vector3(0, 1.5, 5);

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
    // Calculate mouse position in normalized device coordinates
    const rect = this.container.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    // Create a virtual plane at z=0 or check against stage
    const intersectionPoint = new THREE.Vector3();
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    
    if (this.raycaster.ray.intersectPlane(plane, intersectionPoint)) {
      this.lookAtTarget.copy(intersectionPoint);
      console.log(`[Flow] New LookAt Target:`, this.lookAtTarget);
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
    this.scene.add(this.avatarModel);

    // Find and cache the Head bone
    this.headBone = this.avatarModel.getObjectByName('Head') || null;
    if (!this.headBone) {
      // In some GLB models, the head might be named differently (e.g. 'neck')
      this.avatarModel.traverse(child => {
        if (child.name.toLowerCase().includes('head')) this.headBone = child;
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
       if (this.headBone) {
         this.currentLookAt.lerp(this.lookAtTarget, 0.1); // Smooth transition
         this.headBone.lookAt(this.currentLookAt);
         // Bone lookAt adjustment (GLTF bones often point Y up or X side)
         this.headBone.rotateX(Math.PI / 2); 
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
