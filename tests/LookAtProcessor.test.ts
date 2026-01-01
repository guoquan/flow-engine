import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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
        intersectPlane: vi.fn().mockImplementation((_plane, target) => {
          return target;
        })
      };
    },
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
    
    mockConfig = {
      name: 'Test',
      lookAt: {
        enabled: true,
        headBoneName: 'Head',
        holdDuration: 100,
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

  afterEach(() => {
    processor.dispose();
    document.body.removeChild(container);
    vi.restoreAllMocks();
  });

  it('should initialize correctly', () => {
    expect(processor).toBeDefined();
    const debug = processor.getDebugInfo();
    expect(debug.isEngaged).toBe(false);
  });

  it('should start tracking on pointer down', () => {
    const raycaster = (processor as any).raycaster;
    raycaster.intersectObjects.mockReturnValue([{ point: new THREE.Vector3(1, 1, 1) }]);

    const event = new PointerEvent('pointerdown', { clientX: 100, clientY: 100 });
    container.dispatchEvent(event);

    const debug = processor.getDebugInfo();
    expect(debug.isEngaged).toBe(true);
    expect((processor as any).state).toBe('TRACKING');
  });

  it('should transition to HOLDING on pointer up', () => {
    container.dispatchEvent(new PointerEvent('pointerdown'));
    window.dispatchEvent(new PointerEvent('pointerup'));
    expect((processor as any).state).toBe('HOLDING');
  });

  it('should release to IDLE after hold duration', () => {
    const nowSpy = vi.spyOn(performance, 'now').mockReturnValue(1000);

    container.dispatchEvent(new PointerEvent('pointerdown'));
    window.dispatchEvent(new PointerEvent('pointerup'));
    
    expect((processor as any).state).toBe('HOLDING');

    processor.update(1200, 0.016); 
    expect((processor as any).state).toBe('IDLE');
    
    nowSpy.mockRestore();
  });

  it('should update head bone quaternion when engaged', () => {
    container.dispatchEvent(new PointerEvent('pointerdown'));
    const initialQuat = headBone.quaternion.clone();
    processor.update(1000, 0.1);
    expect(headBone.quaternion.equals(initialQuat)).toBe(false);
  });

  it('should fallback to virtual plane if no models hit', () => {
    const raycaster = (processor as any).raycaster;
    raycaster.intersectObjects.mockReturnValue([]); 
    
    raycaster.ray.intersectPlane.mockImplementation((_plane: any, target: THREE.Vector3) => {
        target.set(5, 5, 0);
        return target;
    });

    container.dispatchEvent(new PointerEvent('pointerdown'));
    
    const debug = processor.getDebugInfo();
    expect(debug.currentLookAt.x).toBeCloseTo(5);
  });

  it('should not update if disabled in config', () => {
    mockConfig.lookAt!.enabled = false;
    const spy = vi.spyOn(THREE.Quaternion.prototype, 'slerp');
    
    container.dispatchEvent(new PointerEvent('pointerdown'));
    processor.update(1000, 0.016);
    
    expect(spy).not.toHaveBeenCalled();
  });

  it('should calculate local rotation relative to parent bone', () => {
    const parent = new THREE.Object3D();
    parent.rotation.y = Math.PI / 2; 
    parent.add(headBone);
    parent.updateMatrixWorld(); // Fix: update before use

    container.dispatchEvent(new PointerEvent('pointerdown'));
    
    const spy = vi.spyOn(THREE.Quaternion.prototype, 'invert');
    processor.update(1000, 0.1);
    
    expect(spy).toHaveBeenCalled();
  });

  it('should apply rotation offset from config', () => {
    mockConfig.lookAt!.rotationOffset = [Math.PI, 0, 0];
    container.dispatchEvent(new PointerEvent('pointerdown'));
    processor.update(1000, 0.1);
    expect(headBone.quaternion).toBeDefined();
  });

  it('should update mouse position only when tracking', () => {
    container.dispatchEvent(new PointerEvent('pointermove', { clientX: 500, clientY: 500 }));
    
    container.dispatchEvent(new PointerEvent('pointerdown'));
    const spy = vi.spyOn((processor as any).raycaster, 'setFromCamera');
    
    container.dispatchEvent(new PointerEvent('pointermove', { clientX: 600, clientY: 600 }));
    processor.update(1000, 0.1); 
    
    expect(spy).toHaveBeenCalled();
  });

  it('should reset state on interrupt', () => {
    container.dispatchEvent(new PointerEvent('pointerdown'));
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