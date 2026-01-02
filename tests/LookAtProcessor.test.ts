/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as THREE from 'three';
import { LookAtProcessor } from '../src/core/LookAtProcessor';

describe('LookAtProcessor', () => {
  let processor: LookAtProcessor;
  let container: HTMLDivElement;
  let camera: THREE.PerspectiveCamera;
  let headBone: THREE.Bone;
  let currentTime = 0;

  beforeEach(() => {
    // Setup DOM
    container = document.createElement('div');
    container.style.width = '1000px';
    container.style.height = '1000px';
    document.body.appendChild(container);
    
    // Setup Scene
    camera = new THREE.PerspectiveCamera();
    headBone = new THREE.Bone();
    headBone.name = 'Head';

    // Mock performance.now
    currentTime = 1000;
    vi.spyOn(performance, 'now').mockImplementation(() => currentTime);

    processor = new LookAtProcessor(
      container,
      camera,
      () => headBone,
      () => ({
        lookAt: {
          enabled: true,
          influence: 1.0,
          lerpSpeed: 5.0,
          maxRotation: [Math.PI / 4, Math.PI / 4],
          holdDuration: 2000
        }
      } as any),
      () => []
    );
  });

  afterEach(() => {
    if (processor) processor.dispose();
    if (container && container.parentNode) {
        document.body.removeChild(container);
    }
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
    window.dispatchEvent(new PointerEvent('pointerup'));
    expect((processor as any).state).toBe('HOLDING');
  });

  it('should release to IDLE after hold duration', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    container.dispatchEvent(new PointerEvent('pointerdown', { clientX: 100, clientY: 100 }));
    
    currentTime = 2000; // Pointer up at 2000ms
    window.dispatchEvent(new PointerEvent('pointerup'));
    
    // Move time forward
    currentTime = 5000; 
    processor.update(currentTime, 0.016); 
    
    expect((processor as any).state).toBe('IDLE');
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('releasing'));
  });

  it('should update head bone quaternion when engaged', () => {
    const initialQuaternion = headBone.quaternion.clone();
    
    // Force engagement
    (processor as any).state = 'TRACKING';
    // Force lookAtTarget to be far away
    (processor as any).lookAtTarget.set(10, 10, 10);
    
    // Multiple updates to overcome damping
    for(let i=0; i<10; i++) {
        processor.update(currentTime + i*16, 0.016);
    }
    
    expect(headBone.quaternion.equals(initialQuaternion)).toBe(false);
  });

  it('should handle camera inside head (zero distance) gracefully', () => {
    // Move camera to head position (0,0,0)
    camera.position.set(0, 0, 0);
    headBone.position.set(0, 0, 0);
    headBone.updateMatrixWorld(true);

    container.dispatchEvent(new PointerEvent('pointerdown', { clientX: 100, clientY: 100 }));
    
    expect((processor as any).state).toBe('TRACKING');
    
    // Check if plane normal is valid (fallback logic worked)
    const normal = (processor as any).activePlane.normal;
    expect(normal.length()).toBeCloseTo(1);
    expect(isNaN(normal.x)).toBe(false);
  });

  it('should handle camera inside head gracefully even if getWorldDirection is missing', () => {
    // Create a camera-like object without getWorldDirection
    const simpleCamera = new THREE.Camera();
    (simpleCamera as any).getWorldDirection = undefined;
    
    // Position at head
    simpleCamera.position.set(0, 0, 0);
    headBone.position.set(0, 0, 0);
    headBone.updateMatrixWorld(true);

    // Inject simple camera
    (processor as any).camera = simpleCamera;

    container.dispatchEvent(new PointerEvent('pointerdown', { clientX: 100, clientY: 100 }));
    
    expect((processor as any).state).toBe('TRACKING');
    const normal = (processor as any).activePlane.normal;
    expect(normal.x).toBe(0);
    expect(normal.y).toBe(0);
    expect(normal.z).toBe(1);
  });

  it('should fallback to virtual plane if no models hit', () => {
    container.dispatchEvent(new PointerEvent('pointerdown', { clientX: 100, clientY: 100 }));
    processor.update(currentTime, 0.016);
    expect((processor as any).lookAtTarget).toBeDefined();
  });

  it('should not update if disabled in config', () => {
    // Override config getter
    (processor as any).getConfig = () => ({
        lookAt: { enabled: false }
    });
    
    const initialQuaternion = headBone.quaternion.clone();
    (processor as any).state = 'TRACKING';
    (processor as any).lookAtTarget.set(10, 10, 10);
    
    processor.update(currentTime, 0.016);
    
    expect(headBone.quaternion.equals(initialQuaternion)).toBe(true);
  });

  it('should update mouse position only when tracking', () => {
    const moveEvent = new PointerEvent('pointermove', { clientX: 500, clientY: 500 });
    container.dispatchEvent(moveEvent);
    expect((processor as any).mouse.x).toBe(0);
  });

  it('should reset state on interrupt', () => {
    (processor as any).state = 'TRACKING';
    processor.interrupt();
    expect((processor as any).state).toBe('IDLE');
  });

  it('should remove event listeners on dispose', () => {
    const removeSpy = vi.spyOn(container, 'removeEventListener');
    processor.dispose();
    expect(removeSpy).toHaveBeenCalled();
  });
});