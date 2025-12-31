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
      intersectObjects = vi.fn().mockReturnValue([]); // Default empty hits
      ray = {
        intersectPlane: vi.fn().mockImplementation((_plane, target) => {
          target.set(1, 2, 3); // Mock intersection point
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
    expect(container.children.length).toBeGreaterThan(0);
  });

  it('should find head bone in avatar model', async () => {
    const mockHead = new THREE.Object3D();
    mockHead.name = 'Head';
    const mockModel = new THREE.Group();
    mockModel.add(mockHead);

    // Use specific cast to access private members for testing
    const loader = (engine as unknown as { loader: any }).loader;
    loader.load.mockResolvedValueOnce({
      model: mockModel,
      config: { name: 'LookAtAvatar' },
      animations: [],
    });

    await engine.loadAvatar('dummy-url');
    expect((engine as unknown as { headBone: THREE.Object3D }).headBone).toBe(mockHead);
  });

  it('should update lookAtTarget on pointer down', () => {
    const event = new PointerEvent('pointerdown', {
      clientX: 100,
      clientY: 100,
    });
    
    (engine as any).onPointerDown(event);

    const target = (engine as unknown as { lookAtTarget: THREE.Vector3 }).lookAtTarget;
    expect(target.x).toBe(1);
    expect(target.y).toBe(2);
    expect(target.z).toBe(3);
  });

  it('should transition through all LookAt states: LOOKING -> HOLDING -> RETURNING -> IDLE', async () => {
    vi.useFakeTimers();
    const mockHead = new THREE.Object3D();
    mockHead.name = 'Head';
    const mockModel = new THREE.Group();
    mockModel.add(mockHead);

    const engineInternal = engine as any;
    engineInternal.loader.load.mockResolvedValueOnce({
      model: mockModel,
      config: { 
        name: 'StateAvatar',
        lookAt: { enabled: true, lerpFactor: 1.0, holdDuration: 1000 } 
      },
      animations: [],
    });

    await engine.loadAvatar('dummy-url');
    
    // 1. IDLE -> LOOKING
    const event = new PointerEvent('pointerdown', { clientX: 100, clientY: 100 });
    engineInternal.onPointerDown(event);
    expect(engineInternal.lookAtState).toBe('LOOKING');

    // 2. LOOKING -> HOLDING (One frame with lerp 1.0)
    engineInternal.animate(16.6);
    expect(engineInternal.lookAtState).toBe('HOLDING');

    // 3. HOLDING -> RETURNING (Fast forward time)
    vi.advanceTimersByTime(1500);
    engineInternal.animate(1016.6);
    expect(engineInternal.lookAtState).toBe('RETURNING');

    // 4. RETURNING -> IDLE (One frame with lerp 1.0)
    engineInternal.animate(1032.2);
    expect(engineInternal.lookAtState).toBe('IDLE');

    vi.useRealTimers();
  });

  it('should apply rotationOffset from config', async () => {
    const mockHead = new THREE.Object3D();
    mockHead.name = 'Head';
    const mockModel = new THREE.Group();
    mockModel.add(mockHead);

    const engineInternal = engine as any;
    engineInternal.loader.load.mockResolvedValueOnce({
      model: mockModel,
      config: { 
        name: 'OffsetAvatar',
        lookAt: { enabled: true, rotationOffset: [0.1, 0.2, 0.3] } 
      },
      animations: [],
    });

    await engine.loadAvatar('dummy-url');
    engineInternal.lookAtState = 'LOOKING';
    
    const rotateXSpy = vi.spyOn(mockHead, 'rotateX');
    const rotateYSpy = vi.spyOn(mockHead, 'rotateY');
    const rotateZSpy = vi.spyOn(mockHead, 'rotateZ');

    engineInternal.animate(16.6);

    expect(rotateXSpy).toHaveBeenCalledWith(0.1);
    expect(rotateYSpy).toHaveBeenCalledWith(0.2);
    expect(rotateZSpy).toHaveBeenCalledWith(0.3);
  });

  it('should NOT look at target if lookAt is disabled in config', async () => {
    const mockHead = new THREE.Object3D();
    mockHead.name = 'Head';
    const mockModel = new THREE.Group();
    mockModel.add(mockHead);

    const engineInternal = engine as any;
    engineInternal.loader.load.mockResolvedValueOnce({
      model: mockModel,
      config: { 
        name: 'DisabledAvatar',
        lookAt: { enabled: false } 
      },
      animations: [],
    });

    await engine.loadAvatar('dummy-url');
    engineInternal.lookAtState = 'LOOKING';
    
    const lookAtSpy = vi.spyOn(mockHead, 'lookAt');
    engineInternal.animate(16.6);

    expect(lookAtSpy).not.toHaveBeenCalled();
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
    // Mock window properties
    (window as any).innerWidth = 1024;
    (window as any).innerHeight = 768;
    
    // Use proper casting
    const engineInternal = engine as unknown as { camera: THREE.PerspectiveCamera; renderer: any };
    const cameraSpy = vi.spyOn(engineInternal.camera, 'updateProjectionMatrix');
    const rendererSpy = vi.spyOn(engineInternal.renderer, 'setSize');
    
    // Trigger resize
    window.dispatchEvent(new Event('resize'));
    
    expect(cameraSpy).toHaveBeenCalled();
    expect(rendererSpy).toHaveBeenCalledWith(1024, 768);
  });

  it('should load stage and initialize stage animator', async () => {
    const mockStage = new THREE.Group();
    const mockAnimations = [new THREE.AnimationClip('StageIdle', 1, [])];
    
    const engineInternal = engine as unknown as { stageLoader: any; stageModel: THREE.Object3D; stageAnimController: any };
    engineInternal.stageLoader.load.mockResolvedValueOnce({
      model: mockStage,
      config: { name: 'TestStage', animations: { defaultState: 'idle', states: { idle: { clipName: 'StageIdle' } } } },
      animations: mockAnimations,
    });

    await engine.loadStage('dummy-stage-url');
    
    expect(engineInternal.stageModel).toBe(mockStage);
    expect(engineInternal.stageAnimController).toBeDefined();
  });

  it('should fallback to case-insensitive head bone lookup', async () => {
    const mockHead = new THREE.Object3D();
    mockHead.name = 'my-head-bone'; // No 'Head', but contains 'head'
    const mockModel = new THREE.Group();
    mockModel.add(mockHead);

    const engineInternal = engine as any;
    engineInternal.loader.load.mockResolvedValueOnce({
      model: mockModel,
      config: { name: 'LowercaseAvatar' },
      animations: [],
    });

    await engine.loadAvatar('dummy-url');
    expect(engineInternal.headBone).toBe(mockHead);
  });

  it('should remove old avatar before loading new one', async () => {
    const engineInternal = engine as any;
    const sceneRemoveSpy = vi.spyOn(engineInternal.scene, 'remove');
    
    // Load first
    await engine.loadAvatar('url1');
    
    // Load second
    await engine.loadAvatar('url2');
    
    expect(sceneRemoveSpy).toHaveBeenCalled();
  });

  it('should reset LookAt state when playAction is called', () => {
    const engineInternal = engine as any;
    engineInternal.lookAtState = 'LOOKING';
    
    engine.playAction('wave');
    
    expect(engineInternal.lookAtState).toBe('IDLE');
  });
});
