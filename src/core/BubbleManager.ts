import * as THREE from 'three';

export class BubbleManager {
  private container: HTMLElement;
  private bubble: HTMLElement;
  private target: THREE.Object3D | null = null;
  private camera: THREE.Camera;
  private visible = false;
  private offset = new THREE.Vector3(0, 2.2, 0); // Default head height offset
  private _tempVec = new THREE.Vector3();

  constructor(containerId: string, camera: THREE.Camera) {
    const parent = document.getElementById(containerId);
    if (!parent) throw new Error('Container not found');
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

    const x = (this._tempVec.x * .5 + .5) * this.container.clientWidth;
    const y = (this._tempVec.y * -.5 + .5) * this.container.clientHeight;

    this.bubble.style.transform = `translate(-50%, -100%) translate(${x}px, ${y - 20}px)`;
  }
}
