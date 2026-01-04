import * as THREE from 'three';
// @ts-ignore
import { WebGPURenderer } from 'three/webgpu';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { AvatarLoader } from './AvatarLoader';
import { StageLoader } from './StageLoader';
import { AnimationController } from './AnimationController';
import { LookAtProcessor } from './LookAtProcessor';
import { BehaviorController } from './BehaviorController';
import { BubbleManager } from './BubbleManager';
import { AvatarBehaviorStates, type AvatarConfig, type BehaviorIntent, type AvatarBehaviorState, type AgentResponse, type ActionCommand } from '../types';

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
  private brain: BehaviorController;
  private bubbleManager: BubbleManager;
  private currentAvatarConfig: AvatarConfig | null = null;

  // Debug Helpers
  public isDebug = false;
  private debugTargetMesh: THREE.Mesh | null = null;
  private debugPlaneMesh: THREE.GridHelper | null = null;

  constructor(containerId: string) {
    const container = document.getElementById(containerId);
    if (!container) throw new Error(`Container #${containerId} not found`);
    this.container = container;
    
    // Init Logic
    this.clock = new THREE.Clock();
    this.loader = new AvatarLoader();
    this.stageLoader = new StageLoader();
    this.brain = new BehaviorController();

    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a1a);
    this.scene.fog = new THREE.Fog(0x1a1a1a, 10, 50);

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(
      45, 
      this.container.clientWidth / this.container.clientHeight, 
      0.1, 
      100
    );
    this.camera.position.set(0, 1.5, 5);

    // 3. Renderer (WebGPU)
    this.renderer = new WebGPURenderer({ antialias: true, alpha: true });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.container.appendChild(this.renderer.domElement);

    // 4. Lights
    this.setupLights();

    // 5. Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.target.set(0, 1, 0);

    // 6. Initialize Processors
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
    
    this.bubbleManager = new BubbleManager(containerId, this.camera);

    // 7. Connect Brain to Reflexes
    this.brain.onStateChange = (state: AvatarBehaviorState, intent: BehaviorIntent) => {
      if (!this.animController) return;
      
      switch (state) {
        case AvatarBehaviorStates.IDLE:
          this.animController.play('idle');
          this.lookAtProcessor.reset();
          this.bubbleManager.hide();
          break;
        case AvatarBehaviorStates.TALKING:
          this.animController.play('talk');
          // Use clone to lock current position and avoid live-reference tracking issues
          this.lookAtProcessor.setTarget(this.camera.position.clone());
          if (intent.text) this.bubbleManager.show(intent.text, 'speech');
          break;
        case AvatarBehaviorStates.THINKING:
          this.animController.play('thinking');
          this.bubbleManager.show('...', 'thought');
          break;
        case AvatarBehaviorStates.LISTENING:
          this.animController.play('idle'); 
          this.lookAtProcessor.setTarget(this.camera.position.clone());
          this.bubbleManager.hide();
          break;
        case AvatarBehaviorStates.EMOTIONAL:
          this.animController.play('idle');
          this.lookAtProcessor.setTarget(this.camera.position.clone());
          this.bubbleManager.hide();
          break;
      }
    };

    // 8. Event Handlers
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
          walk: { clipName: 'Walking', loop: true },
          wave: { clipName: 'Wave', loop: false, next: 'idle' },
          talk: { clipName: 'Talk', loop: true },
          thinking: { clipName: 'Thinking', loop: true },
          dance: { clipName: 'Dance', loop: false, next: 'idle' },
          bow: { clipName: 'Bow', loop: false, next: 'idle' }
        }
      };
      this.animController.init(animConfig);
    }

    if (this.headBone) {
      this.bubbleManager.setTarget(this.headBone);
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
    if (enabled) {
      this.createDebugHelpers();
      this.brain.setDebugMode(true);
    } else {
      this.removeDebugHelpers();
      this.brain.setDebugMode(false);
    }
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
      // Proportional grid matching interaction plane scale (5x5 units)
      const grid = new THREE.GridHelper(5, 10, 0x00ff00, 0x008800);
      (grid.material as THREE.Material).transparent = true;
      (grid.material as THREE.Material).opacity = 0.5; // Moderate visibility
      grid.rotateX(Math.PI / 2);
      this.debugPlaneMesh = grid;
      this.scene.add(this.debugPlaneMesh);
    }
  }

  private updateDebugHelpers() {
    if (!this.isDebug || !this.lookAtProcessor) return;

    const info = this.lookAtProcessor.getDebugInfo();
    const hasPlane = !!(info.planeCenter && info.activePlane);
    
    // Target ball visible only when actually looking
    if (this.debugTargetMesh) {
      this.debugTargetMesh.position.copy(info.currentLookAt);
      this.debugTargetMesh.visible = info.isEngaged;
    }

    // Grid visible whenever Debug is ON and we have a plane
    if (this.debugPlaneMesh) {
      this.debugPlaneMesh.visible = hasPlane; 
      
      if (hasPlane) {
        // POSITION: Match the center of the active plane
        this.debugPlaneMesh.position.copy(info.planeCenter);
        
        // ROTATION: Match the plane normal
        const normal = info.activePlane.normal;
        const targetPos = this.debugPlaneMesh.position.clone().add(normal);
        this.debugPlaneMesh.lookAt(targetPos);
        this.debugPlaneMesh.rotateX(Math.PI / 2);
      }
    }
  }

  private removeDebugHelpers() {
    if (this.debugTargetMesh) { this.scene.remove(this.debugTargetMesh); this.debugTargetMesh = null; }
    if (this.debugPlaneMesh) { this.scene.remove(this.debugPlaneMesh); this.debugPlaneMesh = null; }
  }

  private onWindowResize() {
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
  }

  public isAutoRotate = false;

  /**
   * HIGH-LEVEL BEHAVIOR API
   */

  /**
   * Submit a 'TALKING' intent to the brain.
   * @param text What is being said
   * @param duration Time in ms to stay in talking state
   */
  public say(text: string, duration: number = 3000) {
    this.brain.setIntent({ 
      state: AvatarBehaviorStates.TALKING, 
      text, 
      duration 
    });
  }

  /**
   * Submit a 'THINKING' intent to the brain.
   * @param duration Time in ms to stay in thinking state
   */
  public think(duration: number = 3000) {
    this.brain.setIntent({ 
      state: AvatarBehaviorStates.THINKING, 
      duration 
    });
  }

  /**
   * Submit a complex behavior intent.
   * @param intent The behavior intent object
   */
  public setBehavior(intent: BehaviorIntent) {
    this.brain.setIntent(intent);
  }

  /**
   * Processes a structured response from an AI Agent.
   * This is the primary bridge for Agent-to-Avatar interaction.
   * @param response The structured message according to the Unified Action Protocol
   */
  public processAgentResponse(response: AgentResponse) {
    if (!response || typeof response !== 'object') {
      console.warn('[Flow] Invalid AgentResponse received:', response);
      return;
    }

    console.log('[Flow] Processing Agent Response:', response);

    // 1. Handle high-level state if explicitly provided
    if (response.state) {
      this.brain.setIntent({ 
        state: response.state,
        text: response.text,
        emotion: response.emotion
      });
    } else if (response.text) {
      // 2. Default to TALKING if text is present but state is omitted
      this.say(response.text);
    }

    // 3. Execute discrete actions
    if (response.actions && Array.isArray(response.actions)) {
      response.actions.forEach(cmd => {
        setTimeout(() => {
          this.executeCommand(cmd);
        }, cmd.delay || 0);
      });
    }
  }

  /**
   * Internal executor for discrete action commands.
   * Note: Actions scheduled with delay may conflict if state changes rapidly.
   */
  private executeCommand(cmd: ActionCommand) {
    if (!cmd || !cmd.type) return;

    switch (cmd.type) {
      case 'animation':
        // Directly play animation via animController to avoid brain-reset feedback loops
        if (this.animController) this.animController.play(cmd.name.toLowerCase());
        break;
      case 'expression':
        // Future: Emotional blending/morph targets
        break;
      case 'interaction':
        if (cmd.name === 'lookAt' && cmd.value instanceof THREE.Vector3) {
          this.lookAtProcessor.setTarget(cmd.value);
        }
        break;
      default:
        console.warn('[Flow] Unknown action command type received:', cmd.type, cmd);
        break;
    }
  }

  /**
   * Play a manual low-level action. Interrupts high-level brain state.
   * @param action State name defined in config.animations.states
   */
  public playAction(action: string) {
    this.lookAtProcessor.interrupt();
    this.brain.setIntent({ state: AvatarBehaviorStates.IDLE });
    if (this.animController) this.animController.play(action.toLowerCase());
  }

  private animate(_timeMs: number) {
    const delta = this.clock.getDelta();
    
    // Update Brain
    this.brain.update(_timeMs);

    if (this.avatarModel) {
       if (this.animController) this.animController.update(delta);
       this.lookAtProcessor.update(_timeMs, delta);
       this.bubbleManager.update();
    }
    this.updateDebugHelpers();
    if (this.stageModel && this.stageAnimController) this.stageAnimController.update(delta);
    this.controls.autoRotate = this.isAutoRotate;
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}
