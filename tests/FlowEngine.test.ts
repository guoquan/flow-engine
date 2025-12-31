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

    // Mock the loader to return our specific model
    const loader = (engine as any).loader;
    loader.load.mockResolvedValueOnce({
      model: mockModel,
      config: { name: 'LookAtAvatar' },
      animations: [],
    });

    await engine.loadAvatar('dummy-url');
    expect((engine as any).headBone).toBe(mockHead);
  });

  it('should update lookAtTarget on pointer down', () => {
    // Simulate pointer down event
    const event = new PointerEvent('pointerdown', {
      clientX: 100,
      clientY: 100,
    });
    
    // Manually trigger the private method
    (engine as any).onPointerDown(event);

    // Verify lookAtTarget was updated (based on our Raycaster mock returning 1,2,3)
    const target = (engine as any).lookAtTarget;
    expect(target.x).toBe(1);
    expect(target.y).toBe(2);
    expect(target.z).toBe(3);
  });

  it('should apply smooth rotation to head bone in animate', async () => {
    const mockHead = new THREE.Object3D();
    mockHead.name = 'Head';
    const mockModel = new THREE.Group();
    mockModel.add(mockHead);

    (engine as any).loader.load.mockResolvedValueOnce({
      model: mockModel,
      config: { name: 'LookAtAvatar' },
      animations: [],
    });

    await engine.loadAvatar('dummy-url');
    
    // Set a target far away
    (engine as any).lookAtTarget.set(10, 10, 10);
    
    // Spy on lookAt
    const lookAtSpy = vi.spyOn(mockHead, 'lookAt');
    
    // Trigger one frame
    (engine as any).animate(16.6);

    expect(lookAtSpy).toHaveBeenCalled();
  });

  it('should handle window resize', () => {
    // Mock window properties
    (window as any).innerWidth = 1024;
    (window as any).innerHeight = 768;
    
    // Spy on camera and renderer
    const cameraSpy = vi.spyOn((engine as any).camera, 'updateProjectionMatrix');
    const rendererSpy = vi.spyOn((engine as any).renderer, 'setSize');
    
    // Trigger resize
    window.dispatchEvent(new Event('resize'));
    
    expect(cameraSpy).toHaveBeenCalled();
    expect(rendererSpy).toHaveBeenCalledWith(1024, 768);
  });

  it('should load stage and initialize stage animator', async () => {
    const mockStage = new THREE.Group();
    const mockAnimations = [new THREE.AnimationClip('StageIdle', 1, [])];
    
    const stageLoader = (engine as any).stageLoader;
    stageLoader.load.mockResolvedValueOnce({
      model: mockStage,
      config: { name: 'TestStage', animations: { defaultState: 'idle', states: { idle: { clipName: 'StageIdle' } } } },
      animations: mockAnimations,
    });

    await engine.loadStage('dummy-stage-url');
    
    expect((engine as any).stageModel).toBe(mockStage);
    expect((engine as any).stageAnimController).toBeDefined();
  });

  it('should fallback to case-insensitive head bone lookup', async () => {
    const mockHead = new THREE.Object3D();
    mockHead.name = 'my-head-bone'; // No 'Head', but contains 'head'
    const mockModel = new THREE.Group();
    mockModel.add(mockHead);

    (engine as any).loader.load.mockResolvedValueOnce({
      model: mockModel,
      config: { name: 'LowercaseAvatar' },
      animations: [],
    });

    await engine.loadAvatar('dummy-url');
    expect((engine as any).headBone).toBe(mockHead);
  });

  it('should remove old avatar before loading new one', async () => {
    const sceneRemoveSpy = vi.spyOn((engine as any).scene, 'remove');
    
    // Load first
    await engine.loadAvatar('url1');
    
    // Load second
    await engine.loadAvatar('url2');
    
    expect(sceneRemoveSpy).toHaveBeenCalled();
  });
});
