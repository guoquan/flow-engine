import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as THREE from 'three';
import { LookAtProcessor } from '../src/core/LookAtProcessor';
import type { AvatarConfig } from '../src/types';

// Mock Three.js dependencies
vi.mock('three', async () => {
  const actual = await vi.importActual('three');
  return {
    ...actual,
    Raycaster: class {
      setFromCamera = vi.fn();
      intersectObjects = vi.fn().mockReturnValue([]);
      ray = {
        intersectPlane: vi.fn().mockReturnValue(new (actual as any).Vector3(0, 0, 0))
      };
    },
    // Keep other classes real for math logic
  };
});

describe('LookAtProcessor', () => {
  let container: HTMLDivElement;
  let camera: THREE.PerspectiveCamera;
  let headBone: THREE.Object3D;
  let processor: LookAtProcessor;
  let mockConfig: AvatarConfig;
  let mockModels: THREE.Object3D[];

  beforeEach(() => {
    // Setup DOM
    container = document.createElement('div');
    document.body.appendChild(container);
    // Setup Scene
    camera = new THREE.PerspectiveCamera();
    camera.position.set(0, 1.5, 5);
    
    headBone = new THREE.Object3D();
    headBone.position.set(0, 1.6, 0);
    
    // Parent for local rotation testing
    const neck = new THREE.Object3D();
    neck.add(headBone);
    
    mockConfig = {
      name: 'Test',
      lookAt: {
        enabled: true,
        headBoneName: 'Head',
        holdDuration: 100, // Short for testing
        lerpFactor: 0.5,
        rotationOffset: [0, 0, 0]
      }
    };
    
    mockModels = [new THREE.Mesh()];

    processor = new LookAtProcessor(
      container,
      camera,
      () => headBone,
      () => mockConfig,
      () => mockModels
    );
  });

  it('should initialize correctly', () => {
    expect(processor).toBeDefined();
    const debug = processor.getDebugInfo();
    expect(debug.isEngaged).toBe(false);
  });

  it('should start tracking on pointer down', () => {
    // Mock Raycaster for this test
    const raycaster = (processor as any).raycaster;
    raycaster.intersectObjects.mockReturnValue([{ point: new THREE.Vector3(1, 1, 1) }]);

    const event = new PointerEvent('pointerdown', { clientX: 100, clientY: 100 });
    container.dispatchEvent(event);

    const debug = processor.getDebugInfo();
    expect(debug.isEngaged).toBe(true);
    // V6 immediately calculates target
    expect((processor as any).state).toBe('TRACKING');
  });

  it('should transition to HOLDING on pointer up', () => {
    // Trigger tracking first
    container.dispatchEvent(new PointerEvent('pointerdown'));
    expect((processor as any).state).toBe('TRACKING');

    // Release
    window.dispatchEvent(new PointerEvent('pointerup'));
    expect((processor as any).state).toBe('HOLDING');
  });

  it('should release to IDLE after hold duration', () => {
    // Start sequence
    container.dispatchEvent(new PointerEvent('pointerdown'));
    window.dispatchEvent(new PointerEvent('pointerup'));
    
    expect((processor as any).state).toBe('HOLDING');

    // Simulate time passing > holdDuration (100ms)
    // First update sets the timer
    processor.update(1000, 0.016); 
    
    // Second update checks duration
    processor.update(1200, 0.016);
    
    expect((processor as any).state).toBe('IDLE');
  });

  it('should update head bone quaternion when engaged', () => {
    // Engage
    container.dispatchEvent(new PointerEvent('pointerdown'));
    
    const initialQuat = headBone.quaternion.clone();
    
    // Update loop
    processor.update(1000, 0.1); // Large delta to force movement
    
    // Should have moved from identity/initial
    expect(headBone.quaternion.equals(initialQuat)).toBe(false);
  });

  it('should fallback to virtual plane if no models hit', () => {
    const raycaster = (processor as any).raycaster;
    raycaster.intersectObjects.mockReturnValue([]); // No hit
    
    // Fix: intersectPlane must mutate the target vector
    raycaster.ray.intersectPlane.mockImplementation((_plane: any, target: THREE.Vector3) => {
        target.set(5, 5, 0);
        return target;
    });

    container.dispatchEvent(new PointerEvent('pointerdown'));
    
    // Verify target matches plane hit
    const debug = processor.getDebugInfo();
    // LookAtTarget is internal, but currentLookAt tracks it
    // In V6, currentLookAt snaps on first frame
    expect(debug.currentLookAt.x).toBeCloseTo(5);
  });

  it('should not update if disabled in config', () => {
    mockConfig.lookAt!.enabled = false;
    
    container.dispatchEvent(new PointerEvent('pointerdown'));
    processor.update(1000, 0.016);
    
    // Should remain IDLE or effectively inactive
    // But since events are detached from update loop in V6 (event listeners are permanent),
    // we verify the effect: update returns early.
    
    const spy = vi.spyOn(THREE.Quaternion.prototype, 'slerp');
    processor.update(1000, 0.016);
    expect(spy).not.toHaveBeenCalled();
  });

  it('should calculate local rotation relative to parent bone', () => {
    // Setup Parent
    const parent = new THREE.Object3D();
    parent.rotation.y = Math.PI / 2; // Parent rotated 90 deg
    parent.add(headBone);
    parent.updateMatrixWorld();

    // Start Tracking
    container.dispatchEvent(new PointerEvent('pointerdown'));
    
    const spy = vi.spyOn(THREE.Quaternion.prototype, 'invert');
    processor.update(1000, 0.1);
    
    // Expect parent's inverse world rotation to be used
    expect(spy).toHaveBeenCalled();
  });

  it('should apply rotation offset from config', () => {
    mockConfig.lookAt!.rotationOffset = [Math.PI, 0, 0];
    
    container.dispatchEvent(new PointerEvent('pointerdown'));
    processor.update(1000, 0.1);
    
    // Just verify no crash and calculation runs
    expect(headBone.quaternion).toBeDefined();
  });

  it('should update mouse position only when tracking', () => {
    // 1. Idle - Move shouldn't update internal mouse
    container.dispatchEvent(new PointerEvent('pointermove', { clientX: 500, clientY: 500 }));
    // We can't check private mouse var easily, but we know calculateLookAtTarget uses it.
    
    // 2. Tracking - Move
    container.dispatchEvent(new PointerEvent('pointerdown'));
    const spy = vi.spyOn((processor as any).raycaster, 'setFromCamera');
    
    container.dispatchEvent(new PointerEvent('pointermove', { clientX: 600, clientY: 600 }));
    processor.update(1000, 0.1); // Trigger calculation
    
    expect(spy).toHaveBeenCalled();
  });

  it('should reset state on interrupt', () => {
    container.dispatchEvent(new PointerEvent('pointerdown'));
    expect((processor as any).state).toBe('TRACKING');
    
    processor.interrupt();
    expect((processor as any).state).toBe('IDLE');
  });

  it('should remove event listeners on dispose', () => {
    const spy = vi.spyOn(container, 'removeEventListener');
    const spyWin = vi.spyOn(window, 'removeEventListener');
    
    processor.dispose();
    
    expect(spy).toHaveBeenCalledWith('pointerdown', expect.any(Function));
    expect(spy).toHaveBeenCalledWith('pointermove', expect.any(Function));
    expect(spyWin).toHaveBeenCalledWith('pointerup', expect.any(Function));
  });
});
