import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as THREE from 'three';
import { FlowEngine } from '../src/core/FlowEngine';

describe('FlowEngine', () => {
  let engine: FlowEngine;
  let container: HTMLDivElement;

  beforeEach(() => {
    // Setup DOM
    container = document.createElement('div');
    container.id = 'container';
    document.body.appendChild(container);

    // Mock WebGLRenderer
    vi.stubGlobal('WebGLRenderingContext', vi.fn());
    
    // Mock requestAnimationFrame
    vi.stubGlobal('requestAnimationFrame', vi.fn());

    engine = new FlowEngine({
      containerId: 'container',
      avatarConfigUrl: '/assets/avatars/default/config.json',
      stageConfigUrl: '/assets/stages/default/config.json'
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  it('should initialize with correct container', () => {
    expect(engine).toBeDefined();
  });

  it('should find head bone in avatar model', () => {
    const mesh = new THREE.Mesh();
    const head = new THREE.Bone();
    head.name = 'Head';
    const scene = new THREE.Group();
    scene.add(mesh);
    scene.add(head);

    // Mock lookAt
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    // Internal access for test
    (engine as any).onAvatarLoaded(scene, { modelSrc: '', name: 'LookAtAvatar' }, []);
    
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Avatar "LookAtAvatar" loaded'));
    expect((engine as any).lookAtProcessor['headBone']).toBe(head);
  });

  it('should fallback to case-insensitive head bone lookup', () => {
    const head = new THREE.Bone();
    head.name = 'head'; // lowercase
    const scene = new THREE.Group();
    scene.add(head);

    (engine as any).onAvatarLoaded(scene, { modelSrc: '', name: 'LowercaseAvatar' }, []);
    expect((engine as any).lookAtProcessor['headBone']).toBe(head);
  });

  it('should remove old avatar before loading new one', async () => {
    const oldModel = new THREE.Group();
    (engine as any).avatarModel = oldModel;
    (engine as any).scene.add(oldModel);

    const newModel = new THREE.Group();
    (engine as any).onAvatarLoaded(newModel, { modelSrc: '', name: 'Test Avatar' }, []);

    expect((engine as any).scene.children).not.toContain(oldModel);
    expect((engine as any).scene.children).toContain(newModel);
  });

  it('should update controllers and processor in animation loop', () => {
    const delta = 0.016;
    const animSpy = vi.spyOn((engine as any).animationController, 'update');
    const lookSpy = vi.spyOn((engine as any).lookAtProcessor, 'update');

    (engine as any).update(delta);

    expect(animSpy).toHaveBeenCalledWith(delta);
    expect(lookSpy).toHaveBeenCalledWith(delta);
  });

  it('should play action via flow engine', () => {
    const spy = vi.spyOn((engine as any).animationController, 'playState');
    engine.playAction('wave');
    expect(spy).toHaveBeenCalledWith('wave', undefined);
  });
});
