import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { AvatarLoader } from './AvatarLoader';

export class FlowEngine {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private clock: THREE.Clock;
  private loader: AvatarLoader;
  private avatarModel: THREE.Object3D | null = null;

  constructor(containerId: string) {
    const container = document.getElementById(containerId);
    if (!container) throw new Error(`Container #${containerId} not found`);
    this.container = container;

    // Init Logic
    this.clock = new THREE.Clock();
    this.loader = new AvatarLoader();

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

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.container.appendChild(this.renderer.domElement);

    // 4. Lights
    this.setupLights();

    // 5. Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.target.set(0, 1, 0);

    // 6. Resize Handler
    window.addEventListener('resize', this.onWindowResize.bind(this));

    // Start Loop
    this.animate();
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

    const { model, config } = await this.loader.load(configUrl);
    this.avatarModel = model;
    this.scene.add(this.avatarModel);
    
    console.log(`[Flow] Avatar "${config.name}" loaded successfully.`);
  }

  private onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  // State
  public isAutoRotate = false;
  private currentAction: string | null = null;
  private actionStartTime = 0;
  private actionDuration = 0;

  /**
   * Play a specific action
   */
  public playAction(action: string, duration: number = 2000) {
    this.currentAction = action;
    this.actionStartTime = this.clock.getElapsedTime();
    this.actionDuration = duration / 1000; // Convert to seconds
    console.log(`[FlowEngine] Playing action: ${action}`);
  }

  private animate() {
    requestAnimationFrame(this.animate.bind(this));

    const time = this.clock.getElapsedTime();
    
    if (this.avatarModel) {
       this.updateAnimations(time);
    }

    // Auto Rotate Camera (Optional)
    this.controls.autoRotate = this.isAutoRotate;
    this.controls.update();
    
    this.renderer.render(this.scene, this.camera);
  }

  private updateAnimations(time: number) {
    if (!this.avatarModel) return;

    // Check if we are playing a transient action
    const elapsedActionTime = time - this.actionStartTime;
    const isActionActive = this.currentAction && elapsedActionTime < this.actionDuration;

    // Find parts
    const head = this.avatarModel.getObjectByName('Head');
    const body = this.avatarModel.getObjectByName('Body');
    const leftArm = this.avatarModel.getObjectByName('LeftArm');
    const rightArm = this.avatarModel.getObjectByName('RightArm');

    if (isActionActive) {
      this.applyActionAnimation(this.currentAction!, elapsedActionTime, { head, body, leftArm, rightArm });
    } else {
      this.currentAction = null; // Reset to idle
      this.updateIdleAnimation(time, { head, body, leftArm, rightArm });
    }
  }

  private applyActionAnimation(action: string, elapsed: number, parts: any) {
    const { head, body, leftArm, rightArm } = parts;

    switch (action) {
      case 'wave':
        if (rightArm) {
          // Raise arm and wave
          rightArm.rotation.z = -Math.PI / 1.5; 
          rightArm.rotation.x = Math.sin(elapsed * 10) * 0.5;
        }
        break;

      case 'dance':
        if (body) {
          body.position.y = 0.5 + Math.abs(Math.sin(elapsed * 10)) * 0.2;
          body.rotation.z = Math.sin(elapsed * 10) * 0.1;
        }
        if (leftArm) leftArm.rotation.z = Math.PI / 2 + Math.sin(elapsed * 10) * 0.5;
        if (rightArm) rightArm.rotation.z = -Math.PI / 2 + Math.sin(elapsed * 10) * 0.5;
        break;

      case 'bow':
        if (body) body.rotation.x = Math.min(elapsed * 1, 0.5); // Lean forward
        if (head) head.rotation.x = Math.min(elapsed * 1.5, 0.3);
        break;
    }
  }

  private updateIdleAnimation(time: number, parts: any) {
    const { head, body, leftArm, rightArm } = parts;

    // 1. Body Floating (Breathing)
    this.avatarModel!.position.y = Math.sin(time * 1.5) * 0.02;
    if (body) body.rotation.x = 0; // Reset from bow

    // 3. Animate Parts
    if (head) {
      head.rotation.y = Math.sin(time * 0.5) * 0.05;
      head.rotation.x = Math.sin(time * 0.8) * 0.02;
    }

    if (leftArm) {
      leftArm.rotation.z = (Math.PI / 4) + Math.sin(time * 2 + 1) * 0.05;
      leftArm.rotation.x = 0;
    }

    if (rightArm) {
      rightArm.rotation.z = (-Math.PI / 4) - Math.sin(time * 2) * 0.05;
      rightArm.rotation.x = 0;
    }
  }
}
