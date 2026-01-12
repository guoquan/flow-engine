import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as THREE from 'three';
import { BubbleManager } from '../src/core/BubbleManager';

// Mock Canvas API since it's not available in JSDOM fully or we want to avoid actual rendering
HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
  clearRect: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  quadraticCurveTo: vi.fn(),
  closePath: vi.fn(),
  fill: vi.fn(),
  arc: vi.fn(),
  measureText: vi.fn().mockReturnValue({ width: 10 }),
  fillText: vi.fn(),
  set font(val) {},
  set textAlign(val) {},
  set textBaseline(val) {},
  set fillStyle(val) {},
  set shadowColor(val) {},
  set shadowBlur(val) {},
  set shadowOffsetX(val) {},
  set shadowOffsetY(val) {},
});

describe('BubbleManager', () => {
  let manager: BubbleManager;
  let scene: THREE.Scene;
  let camera: THREE.Camera;

  beforeEach(() => {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera();
    manager = new BubbleManager(scene);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create sprite and add to scene on init', () => {
    // Check if sprite was added to scene
    const sprite = scene.children.find(c => c instanceof THREE.Sprite);
    expect(sprite).toBeTruthy();
    expect(sprite?.visible).toBe(false);
  });

  it('should show speech bubble and update visibility', () => {
    manager.show('Hello', 'speech');
    const sprite = scene.children.find(c => c instanceof THREE.Sprite) as THREE.Sprite;
    expect(sprite.visible).toBe(true);
    
    // Verify texture update was requested by checking if drawing occurred
    // Access the mock context via the prototype mock we set up
    const mockContext = (document.createElement('canvas').getContext('2d') as any);
    expect(mockContext.fillText).toHaveBeenCalled();
  });

  it('should hide bubble', () => {
    manager.show('Hello');
    manager.hide();
    const sprite = scene.children.find(c => c instanceof THREE.Sprite) as THREE.Sprite;
    expect(sprite.visible).toBe(false);
  });

  it('should update position when visible', () => {
    const target = new THREE.Object3D();
    target.position.set(10, 0, 0);
    manager.setTarget(target);
    manager.show('Hello');

    // Simulate world matrix update (simplified)
    vi.spyOn(target, 'getWorldPosition').mockImplementation((vec) => vec.set(10, 0, 0));

    manager.update();
    const sprite = scene.children.find(c => c instanceof THREE.Sprite) as THREE.Sprite;
    
    // Should be at target X (10) + offset Y
    expect(sprite.position.x).toBe(10);
    expect(sprite.position.y).toBeGreaterThan(0); // Offset Y
  });

  it('should do nothing on update if not visible or no target', () => {
    const sprite = scene.children.find(c => c instanceof THREE.Sprite) as THREE.Sprite;
    sprite.position.set(0, 0, 0);
    
    manager.update();
    
    // Position should remain unchanged (0,0,0) because it wasn't visible/no target
    expect(sprite.position.x).toBe(0);
    expect(sprite.position.y).toBe(0);
  });
});
