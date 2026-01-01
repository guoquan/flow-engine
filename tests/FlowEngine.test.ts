import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as THREE from 'three';
import { describe, it, expect, vi, afterEach } from 'vitest';
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
    // Mock LookAtProcessor dependencies if needed
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

// Mock LookAtProcessor
vi.mock('../src/core/LookAtProcessor', () => ({
  LookAtProcessor: class {
    update = vi.fn();
    getDebugInfo = vi.fn().mockReturnValue({ isEngaged: false });
    interrupt = vi.fn();
    dispose = vi.fn();
  },
}));

// Mock Loaders
vi.mock('../src/core/AvatarLoader', () => ({
  AvatarLoader: class {
    load = vi.fn().mockResolvedValue({
      model: new THREE.Group(),
      config: { name: 'Test Avatar' },
      animations: [new THREE.AnimationClip('idle', 1, [])],
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

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = '';
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

  it('should toggle debug mode and helpers', () => {
    const engineInternal = engine as any;
    
    // Enable Debug
    engine.setDebug(true);
    expect(engineInternal.isDebug).toBe(true);
    expect(engineInternal.debugTargetMesh).toBeDefined();
    expect(engineInternal.debugPlaneMesh).toBeDefined();
    expect(engineInternal.scene.children).toContain(engineInternal.debugTargetMesh);
    expect(engineInternal.scene.children).toContain(engineInternal.debugPlaneMesh);

    // Disable Debug
    engine.setDebug(false);
    expect(engineInternal.isDebug).toBe(false);
    expect(engineInternal.debugTargetMesh).toBeNull();
    expect(engineInternal.debugPlaneMesh).toBeNull();
  });

  it('should update debug helpers during animation when debug is on', async () => {
    const engineInternal = engine as any;
    engine.setDebug(true);
    
    // Setup mock processor return
    engineInternal.lookAtProcessor.getDebugInfo.mockReturnValue({
      isEngaged: true,
      currentLookAt: new THREE.Vector3(1, 2, 3),
      activePlane: new THREE.Plane(),
      planeCenter: new THREE.Vector3(0, 1.5, 2.5)
    });

    // Mock lookAt for plane mesh
    const lookAtSpy = vi.spyOn(THREE.Object3D.prototype, 'lookAt');

    engineInternal.animate(100);

    expect(engineInternal.debugTargetMesh.visible).toBe(true);
    expect(engineInternal.debugTargetMesh.position.x).toBe(1);
    expect(engineInternal.debugPlaneMesh.visible).toBe(true);
    expect(engineInternal.debugPlaneMesh.position.z).toBe(2.5);
    expect(lookAtSpy).toHaveBeenCalled();
  });

  it('should update controllers and processor in animation loop', async () => {
    const engineInternal = engine as any;
    
    // Load avatar to enable update logic
    await engine.loadAvatar('dummy');
    
    const animSpy = vi.spyOn(engineInternal.animController, 'update');
    const procSpy = vi.spyOn(engineInternal.lookAtProcessor, 'update');
    
    engineInternal.animate(100);
    
    expect(animSpy).toHaveBeenCalled();
    expect(procSpy).toHaveBeenCalled();
  });

  it('should play action via flow engine', async () => {
    const engineInternal = engine as any;
    await engine.loadAvatar('dummy');
    
    const interruptSpy = vi.spyOn(engineInternal.lookAtProcessor, 'interrupt');
    const playSpy = vi.spyOn(engineInternal.animController, 'play');
    
    engine.playAction('WAVE');
    
    expect(interruptSpy).toHaveBeenCalled();
    expect(playSpy).toHaveBeenCalledWith('wave');
  });
});