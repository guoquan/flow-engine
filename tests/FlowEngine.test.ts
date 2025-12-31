import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as THREE from 'three';
import { FlowEngine } from '../src/core/FlowEngine';

// Mock Three.js
vi.mock('three', async () => {
  const actual = await vi.importActual('three');
  return {
    ...actual,
    WebGLRenderer: vi.fn().mockImplementation(() => ({
      setSize: vi.fn(),
      setPixelRatio: vi.fn(),
      render: vi.fn(),
      domElement: document.createElement('canvas'),
    })),
    AnimationMixer: vi.fn().mockImplementation(() => ({
      clipAction: vi.fn().mockReturnValue({ play: vi.fn(), reset: vi.fn(), fadeIn: vi.fn(), fadeOut: vi.fn(), setLoop: vi.fn() }),
      update: vi.fn(),
      stopAllAction: vi.fn(),
      addEventListener: vi.fn(),
    })),
    Raycaster: class {
      setFromCamera = vi.fn();
      intersectObjects = vi.fn().mockReturnValue([]);
      ray = {
        direction: new THREE.Vector3(0, 0, -1),
        closestPointToPoint: vi.fn().mockImplementation((_point, target) => {
          target.set(1, 2, 3);
          return target;
        }),
        intersectSphere: vi.fn().mockImplementation((_sphere, target) => {
          target.set(1, 2, 3);
          return target;
        }),
        intersectPlane: vi.fn().mockImplementation((_plane, target) => {
          target.set(1, 2, 3);
          return target;
        }),
      };
    },
  };
});

// Mock WebGPU Renderer
vi.mock('three/webgpu', () => ({
  WebGPURenderer: class {
    setSize = vi.fn();
    setPixelRatio = vi.fn();
    setAnimationLoop = vi.fn();
    render = vi.fn();
    domElement = document.createElement('canvas');
  },
}));

// Mock Controllers
vi.mock('../src/core/AnimationController', () => ({
  AnimationController: class {
    init = vi.fn();
    update = vi.fn();
    play = vi.fn();
  },
}));

// Mock Loaders
vi.mock('../src/core/AvatarLoader', () => ({
  AvatarLoader: class {
    load = vi.fn().mockResolvedValue({
      model: new THREE.Group(),
      config: { name: 'Test Avatar' },
      animations: [],
    });
  },
}));

vi.mock('../src/core/StageLoader', () => ({
  StageLoader: class {
    load = vi.fn().mockResolvedValue({
      model: new THREE.Group(),
      config: { name: 'Test Stage' },
      animations: [],
    });
  },
}));

describe('FlowEngine', () => {
  let container: HTMLDivElement;
  let engine: FlowEngine;

  beforeEach(() => {
    document.body.innerHTML = '<div id="container"></div>';
    container = document.getElementById('container') as HTMLDivElement;
    engine = new FlowEngine('container');
  });

  it('should initialize correctly', () => {
    expect(engine).toBeDefined();
  });

  it('should set targetWeight to 1.0 on pointer down', () => {
    const event = new PointerEvent('pointerdown');
    (engine as any).onPointerDown(event);
    expect((engine as any).targetWeight).toBe(1.0);
  });

  it('should transition weight and apply slerp in animate', async () => {
    const mockHead = new THREE.Object3D();
    mockHead.name = 'Head';
    const mockModel = new THREE.Group();
    mockModel.add(mockHead);

    const engineInternal = engine as any;
    engineInternal.loader.load.mockResolvedValueOnce({
      model: mockModel,
      config: { name: 'SlerpAvatar', lookAt: { enabled: true } },
      animations: [],
    });

    await engine.loadAvatar('dummy-url');
    engineInternal.targetWeight = 1.0;
    
    const slerpSpy = vi.spyOn(mockHead.quaternion, 'slerp');
    engineInternal.animate(16.6);
    
    expect(engineInternal.lookAtWeight).toBeGreaterThan(0);
    expect(slerpSpy).toHaveBeenCalled();
  });

  it('should use holdTimer to release attention after mouse up', () => {
    const engineInternal = engine as any;
    engineInternal.avatarModel = new THREE.Group();
    engineInternal.headBone = new THREE.Object3D(); // Crucial!
    engineInternal.currentAvatarConfig = { lookAt: { enabled: true, holdDuration: 1000 } };
    engineInternal.isPointerDown = true;
    engineInternal.targetWeight = 1.0;
    engineInternal.lastTimeMs = 5000; // Mock current time

    engineInternal.onPointerUp();
    expect(engineInternal.isPointerDown).toBe(false);
    expect(engineInternal.holdTimer).toBe(5000);
    
    // Run animate with time past holdDuration
    engineInternal.animate(6500);

    expect(engineInternal.targetWeight).toBe(0);
  });

  it('should reset targetWeight when playAction is called', () => {
    const engineInternal = engine as any;
    engineInternal.targetWeight = 1.0;
    engine.playAction('wave');
    expect(engineInternal.targetWeight).toBe(0);
  });

  it('should handle head bone lookup fallback to neck', async () => {
    const mockNeck = new THREE.Object3D();
    mockNeck.name = 'NeckBone';
    const mockModel = new THREE.Group();
    mockModel.add(mockNeck);

    const engineInternal = engine as any;
    engineInternal.loader.load.mockResolvedValueOnce({
      model: mockModel,
      config: { name: 'NeckAvatar' },
      animations: [],
    });

    await engine.loadAvatar('dummy-url');
    expect(engineInternal.headBone).toBe(mockNeck);
  });

  it('should handle window resize', () => {
    const engineInternal = engine as any;
    const cameraSpy = vi.spyOn(engineInternal.camera, 'updateProjectionMatrix');
    const rendererSpy = vi.spyOn(engineInternal.renderer, 'setSize');
    
    window.dispatchEvent(new Event('resize'));
    
    expect(cameraSpy).toHaveBeenCalled();
    expect(rendererSpy).toHaveBeenCalled();
  });

  it('should toggle debug helpers', () => {
    const engineInternal = engine as any;
    engine.setDebug(true);
    expect(engineInternal.debugPlaneMesh).toBeDefined();
    engine.setDebug(false);
    expect(engineInternal.debugPlaneMesh).toBeNull();
  });
});