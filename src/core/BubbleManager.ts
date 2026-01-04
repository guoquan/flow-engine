import * as THREE from 'three';

const HEAD_OFFSET_Y = 2.2;
const NDC_TO_SCREEN_SCALE = 0.5;
const BUBBLE_VERTICAL_MARGIN = 20;
const POSITION_THRESHOLD = 1.0; // Pixel difference threshold for update

export class BubbleManager {
  private container: HTMLElement;
  private bubble: HTMLElement;
  private target: THREE.Object3D | null = null;
  private camera: THREE.Camera;
  private visible = false;
  private offset = new THREE.Vector3(0, HEAD_OFFSET_Y, 0);
  private _tempVec = new THREE.Vector3();
  private lastX = 0;
  private lastY = 0;

  constructor(containerOrId: string | HTMLElement, camera: THREE.Camera) {
    const parent = typeof containerOrId === 'string' 
      ? document.getElementById(containerOrId) 
      : containerOrId;

    if (!parent) throw new Error(`Container not found: ${containerOrId}`);
    this.container = parent;
    this.camera = camera;

    // Create Bubble DOM
    this.bubble = document.createElement('div');
    this.bubble.className = 'bubble hidden';
    this.container.appendChild(this.bubble);
  }

  public setTarget(target: THREE.Object3D) {
    this.target = target;
  }

  public show(text: string, type: 'speech' | 'thought' = 'speech') {
    this.bubble.textContent = text;
    this.bubble.className = `bubble visible ${type}`;
    this.visible = true;
    // Force update on show
    this.lastX = -9999; 
    this.lastY = -9999;
    this.update();
  }

  public hide() {
    this.bubble.className = 'bubble hidden';
    this.visible = false;
  }

  public update() {
    if (!this.visible || !this.target) return;

    // Project world position to screen coordinates
    this._tempVec.copy(this.target.position).add(this.offset);
    this._tempVec.project(this.camera);

    // Check if behind camera
    if (this._tempVec.z > 1) {
        this.bubble.style.display = 'none';
        return;
    } else {
        this.bubble.style.display = '';
    }

    const x = (this._tempVec.x * NDC_TO_SCREEN_SCALE + NDC_TO_SCREEN_SCALE) * this.container.clientWidth;
    const y = (this._tempVec.y * -NDC_TO_SCREEN_SCALE + NDC_TO_SCREEN_SCALE) * this.container.clientHeight;

    // Optimization: Only update DOM if moved significantly
    if (Math.abs(x - this.lastX) > POSITION_THRESHOLD || Math.abs(y - this.lastY) > POSITION_THRESHOLD) {
        this.bubble.style.transform = `translate(-50%, -100%) translate(${x}px, ${y - BUBBLE_VERTICAL_MARGIN}px)`;
        this.lastX = x;
        this.lastY = y;
    }
  }
}
