import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FlowEngine } from '../src/core/FlowEngine';
import * as THREE from 'three';
import { AvatarBehaviorStates } from '../src/types';

// Mock Canvas API for BubbleManager
HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
  clearRect: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  bezierCurveTo: vi.fn(),
  quadraticCurveTo: vi.fn(),
  closePath: vi.fn(),
  fill: vi.fn(),
  arc: vi.fn(),
  measureText: vi.fn().mockReturnValue({ width: 10 }),
  fillText: vi.fn(),
});

// Mock WebGPURenderer as a class
vi.mock('three/webgpu', () => {
  class WebGPURenderer {
    constructor() {}
    setSize = vi.fn();
    setPixelRatio = vi.fn();
    setAnimationLoop = vi.fn();
    dispose = vi.fn();
    render = vi.fn();
    revive = vi.fn();
    domElement = document.createElement('canvas');
    address = vi.fn();
  }
  return { WebGPURenderer };
});

describe('FlowEngine', () => {
  let engine: FlowEngine;
  let container: HTMLDivElement;

  beforeEach(() => {
    // Setup DOM
    container = document.createElement('div');
    container.id = 'container';
    document.body.appendChild(container);

    // Mock requestAnimationFrame
    vi.stubGlobal('requestAnimationFrame', vi.fn());

    engine = new FlowEngine('container');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  it('should initialize with correct container', () => {
    expect(engine).toBeDefined();
  });

  it('should find head bone in avatar model after loading', async () => {
    const head = new THREE.Bone();
    head.name = 'Head';
    const scene = new THREE.Group();
    scene.add(head);

    // Mock loader
    vi.spyOn((engine as any).loader, 'load').mockResolvedValue({
        model: scene,
        config: { name: 'LookAtAvatar', modelSrc: '', lookAt: { headBoneName: 'Head' } },
        animations: []
    });

    await engine.loadAvatar('mock-url');
    
    expect((engine as any).headBone).toBe(head);
  });

  it('should fallback to case-insensitive head bone lookup', async () => {
    const head = new THREE.Bone();
    head.name = 'head'; // lowercase
    const scene = new THREE.Group();
    scene.add(head);

    vi.spyOn((engine as any).loader, 'load').mockResolvedValue({
        model: scene,
        config: { name: 'LowercaseAvatar', modelSrc: '' },
        animations: []
    });

    await engine.loadAvatar('mock-url');
    expect((engine as any).headBone).toBe(head);
  });

  it('should remove old avatar before loading new one', async () => {
    const oldModel = new THREE.Group();
    (engine as any).avatarModel = oldModel;
    (engine as any).scene.add(oldModel);

    const newModel = new THREE.Group();
    vi.spyOn((engine as any).loader, 'load').mockResolvedValue({
        model: newModel,
        config: { name: 'NewAvatar', modelSrc: '' },
        animations: []
    });

    await engine.loadAvatar('new-url');

    expect((engine as any).scene.children).not.toContain(oldModel);
    expect((engine as any).scene.children).toContain(newModel);
  });

  it('should update controllers and processor in animation loop', () => {
    (engine as any).avatarModel = new THREE.Group();
    (engine as any).animController = { update: vi.fn() };
    const lookSpy = vi.spyOn((engine as any).lookAtProcessor, 'update');

    (engine as any).animate(1000);

    expect((engine as any).animController.update).toHaveBeenCalled();
    expect(lookSpy).toHaveBeenCalled();
  });

  it('should play action via flow engine', () => {
    (engine as any).animController = { play: vi.fn() };
    engine.playAction('wave');
    expect((engine as any).animController.play).toHaveBeenCalledWith('wave');
  });

  // --- New Tests for Coverage ---

  it('should load stage successfully', async () => {
    const stageModel = new THREE.Group();
    vi.spyOn((engine as any).stageLoader, 'load').mockResolvedValue({
        model: stageModel,
        config: {},
        animations: []
    });

    await engine.loadStage('stage-url');
    expect((engine as any).stageModel).toBe(stageModel);
    expect((engine as any).scene.children).toContain(stageModel);
  });

  it('should toggle debug helpers', () => {
    // Enable Debug
    engine.setDebug(true);
    expect(engine.isDebug).toBe(true);
    expect((engine as any).debugTargetMesh).toBeDefined();
    expect((engine as any).debugPlaneMesh).toBeDefined();
    
    // Disable Debug
    engine.setDebug(false);
    expect(engine.isDebug).toBe(false);
    expect((engine as any).debugTargetMesh).toBeNull();
  });

  it('should update debug helpers in animate loop', () => {
    engine.setDebug(true);
    
    // Mock lookAtProcessor.getDebugInfo
    vi.spyOn((engine as any).lookAtProcessor, 'getDebugInfo').mockReturnValue({
        isEngaged: true,
        currentLookAt: new THREE.Vector3(1, 2, 3),
        activePlane: { normal: new THREE.Vector3(0, 1, 0) },
        planeCenter: new THREE.Vector3(0, 0, 0),
        weight: 1
    });

    (engine as any).animate(1000);
    
    const targetMesh = (engine as any).debugTargetMesh;
    expect(targetMesh.position.x).toBe(1);
    expect(targetMesh.visible).toBe(true);
  });

  it('should handle window resize', () => {
    const width = 1024;
    const height = 768;
    
    // Mock container dimensions
    vi.spyOn(container, 'clientWidth', 'get').mockReturnValue(width);
    vi.spyOn(container, 'clientHeight', 'get').mockReturnValue(height);

    // @ts-ignore - trigger private handler
    engine.onWindowResize();
    
    expect(engine['camera'].aspect).toBe(width / height);
    expect(engine['renderer'].setSize).toHaveBeenCalled();
  });

  it('should cleanup resources on dispose', () => {
    const disconnectSpy = vi.spyOn(engine['resizeObserver'], 'disconnect');
    const rendererDisposeSpy = vi.spyOn(engine['renderer'], 'dispose');
    const controlsDisposeSpy = vi.spyOn(engine['controls'], 'dispose');
    
    engine.dispose();
    
    expect(disconnectSpy).toHaveBeenCalled();
    expect(rendererDisposeSpy).toHaveBeenCalled();
    expect(controlsDisposeSpy).toHaveBeenCalled();
    // @ts-ignore
    expect(engine['renderer'].setAnimationLoop).toHaveBeenCalledWith(null);
  });
});
