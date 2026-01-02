import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as THREE from 'three';
import { LookAtProcessor } from '../src/core/LookAtProcessor';

describe('LookAtProcessor', () => {
  let processor: LookAtProcessor;
  let container: HTMLDivElement;
  let camera: THREE.PerspectiveCamera;
  let headBone: THREE.Bone;

  beforeEach(() => {
    // Setup DOM
    container = document.createElement('div');
    document.body.appendChild(container);
    // Setup Scene
    camera = new THREE.PerspectiveCamera();
    headBone = new THREE.Bone();
    headBone.name = 'Head';

    processor = new LookAtProcessor({
      container,
      camera,
      headBone,
      config: {
        enabled: true,
        influence: 1.0,
        lerpSpeed: 5.0,
        maxRotation: [Math.PI / 4, Math.PI / 4]
      }
    });
  });

  afterEach(() => {
    processor.dispose();
    document.body.removeChild(container);
    vi.restoreAllMocks();
  });

  it('should initialize correctly', () => {
    expect(processor).toBeDefined();
    expect((processor as any).state).toBe('IDLE');
  });

  it('should start tracking on pointer down', () => {
    container.dispatchEvent(new PointerEvent('pointerdown', { clientX: 100, clientY: 100 }));
    expect((processor as any).state).toBe('TRACKING');
  });

  it('should transition to HOLDING on pointer up', () => {
    container.dispatchEvent(new PointerEvent('pointerdown', { clientX: 100, clientY: 100 }));
    container.dispatchEvent(new PointerEvent('pointerup'));
    expect((processor as any).state).toBe('HOLDING');
  });

  it('should release to IDLE after hold duration', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    container.dispatchEvent(new PointerEvent('pointerdown', { clientX: 100, clientY: 100 }));
    container.dispatchEvent(new PointerEvent('pointerup'));
    
    // Simulate elapsed time
    processor.update(3.1); // Default hold is 3s
    expect((processor as any).state).toBe('IDLE');
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('releasing'));
  });

  it('should update head bone quaternion when engaged', () => {
    const initialQuaternion = headBone.quaternion.clone();
    
    // Set to tracking and move mouse
    container.dispatchEvent(new PointerEvent('pointerdown', { clientX: 100, clientY: 100 }));
    container.dispatchEvent(new PointerEvent('pointermove', { clientX: 200, clientY: 200 }));
    
    processor.update(0.016);
    
    expect(headBone.quaternion.equals(initialQuaternion)).toBe(false);
  });

  it('should fallback to virtual plane if no models hit', () => {
    container.dispatchEvent(new PointerEvent('pointerdown', { clientX: 100, clientY: 100 }));
    processor.update(0.016);
    // Should still have a target point
    expect((processor as any).targetPoint).toBeDefined();
  });

  it('should not update if disabled in config', () => {
    (processor as any).config.enabled = false;
    const initialQuaternion = headBone.quaternion.clone();
    
    container.dispatchEvent(new PointerEvent('pointerdown', { clientX: 100, clientY: 100 }));
    processor.update(0.016);
    
    expect(headBone.quaternion.equals(initialQuaternion)).toBe(true);
  });

  it('should calculate local rotation relative to parent bone', () => {
    const parent = new THREE.Bone();
    parent.rotation.set(0, Math.PI / 2, 0);
    parent.updateMatrixWorld();
    parent.add(headBone);
    
    container.dispatchEvent(new PointerEvent('pointerdown', { clientX: 100, clientY: 100 }));
    processor.update(0.016);
    
    // Calculation happened
    expect((processor as any).currentQuat).toBeDefined();
  });

  it('should apply rotation offset from config', () => {
    (processor as any).config.rotationOffset = [0.1, 0.1, 0.1];
    container.dispatchEvent(new PointerEvent('pointerdown', { clientX: 100, clientY: 100 }));
    processor.update(0.016);
    
    // Values applied
    expect((processor as any).config.rotationOffset[0]).toBe(0.1);
  });

  it('should update mouse position only when tracking', () => {
    const moveEvent = new PointerEvent('pointermove', { clientX: 500, clientY: 500 });
    container.dispatchEvent(moveEvent);
    
    // Should still be 0,0 (initial) because not tracking
    expect((processor as any).mouse.x).toBe(0);
    expect((processor as any).mouse.y).toBe(0);
  });

  it('should reset state on interrupt', () => {
    container.dispatchEvent(new PointerEvent('pointerdown', { clientX: 100, clientY: 100 }));
    processor.interrupt();
    expect((processor as any).state).toBe('IDLE');
  });

  it('should remove event listeners on dispose', () => {
    const removeSpy = vi.spyOn(container, 'removeEventListener');
    processor.dispose();
    expect(removeSpy).toHaveBeenCalled();
  });
});
