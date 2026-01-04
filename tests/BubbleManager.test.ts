import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as THREE from 'three';
import { BubbleManager } from '../src/core/BubbleManager';

describe('BubbleManager', () => {
  let manager: BubbleManager;
  let container: HTMLDivElement;
  let camera: THREE.Camera;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'app';
    // Set dimensions for projection math
    Object.defineProperty(container, 'clientWidth', { value: 1024 });
    Object.defineProperty(container, 'clientHeight', { value: 768 });
    document.body.appendChild(container);
    
    camera = new THREE.PerspectiveCamera();
    manager = new BubbleManager(container, camera);
  });

  afterEach(() => {
    document.body.removeChild(container);
    vi.restoreAllMocks();
  });

  it('should create bubble element on init', () => {
    const bubble = container.querySelector('.bubble');
    expect(bubble).toBeTruthy();
    expect(bubble?.classList.contains('hidden')).toBe(true);
  });

  it('should show speech bubble', () => {
    manager.show('Hello', 'speech');
    const bubble = container.querySelector('.bubble');
    expect(bubble?.textContent).toBe('Hello');
    expect(bubble?.classList.contains('visible')).toBe(true);
    expect(bubble?.classList.contains('speech')).toBe(true);
  });

  it('should show thought bubble', () => {
    manager.show('...', 'thought');
    const bubble = container.querySelector('.bubble');
    expect(bubble?.classList.contains('thought')).toBe(true);
  });

  it('should hide bubble', () => {
    manager.show('Hello');
    manager.hide();
    const bubble = container.querySelector('.bubble');
    expect(bubble?.classList.contains('hidden')).toBe(true);
  });

  it('should update position when visible', () => {
    const target = new THREE.Object3D();
    target.position.set(0, 0, 0);
    manager.setTarget(target);
    manager.show('Hello');

    // Mock project to simulate a point at center of screen
    const projectSpy = vi.spyOn(THREE.Vector3.prototype, 'project').mockImplementation(function(this: THREE.Vector3) {
      this.set(0, 0, 0); // Center in NDC
      return this;
    });

    manager.update();
    const bubble = container.querySelector('.bubble') as HTMLElement;
    expect(bubble.style.transform).toContain('translate');
    
    projectSpy.mockRestore();
  });

  it('should do nothing on update if not visible or no target', () => {
    const bubble = container.querySelector('.bubble') as HTMLElement;
    const initialTransform = bubble.style.transform;
    manager.update();
    expect(bubble.style.transform).toBe(initialTransform);
  });
});