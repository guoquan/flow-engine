import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as THREE from 'three';

// Mock WebGPURenderer
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
  }
  return { WebGPURenderer };
});

import { FlowEngine } from '../src/core/FlowEngine';

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

    // Mock the loader inside engine
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
});
