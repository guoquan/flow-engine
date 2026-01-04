import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as THREE from 'three';
import { FlowEngine } from '../src/core/FlowEngine';
import { AvatarBehaviorStates } from '../src/types';

// Mock WebGPURenderer using a class to satisfy 'new' constructor call
vi.mock('three/webgpu', () => {
  return {
    WebGPURenderer: class {
      domElement = document.createElement('canvas');
      setSize = vi.fn();
      setPixelRatio = vi.fn();
      setAnimationLoop = vi.fn();
      render = vi.fn();
    }
  };
});

describe('FlowEngine Behavior Integration', () => {
  let engine: FlowEngine;
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'app';
    document.body.appendChild(container);
    engine = new FlowEngine('app');
  });

  it('should expose behavior methods', () => {
    expect(engine.say).toBeDefined();
    expect(engine.think).toBeDefined();
    expect(engine.setBehavior).toBeDefined();
  });

  it('should trigger animation when brain state changes', async () => {
    // 1. Setup avatar with animController mocks
    const mockModel = new THREE.Group();
    const mockAnimController = {
      play: vi.fn(),
      init: vi.fn(),
      update: vi.fn()
    };
    
    // Inject mocks into the engine instance
    (engine as any).avatarModel = mockModel;
    (engine as any).animController = mockAnimController;

    // 2. Trigger states via shorthand methods
    engine.say('Hello');
    expect(mockAnimController.play).toHaveBeenCalledWith('talk');

    engine.think();
    expect(mockAnimController.play).toHaveBeenCalledWith('thinking');

    engine.setBehavior({ state: AvatarBehaviorStates.IDLE });
    expect(mockAnimController.play).toHaveBeenCalledWith('idle');

    engine.setBehavior({ state: AvatarBehaviorStates.LISTENING });
    expect(mockAnimController.play).toHaveBeenLastCalledWith('idle');
  });

  it('should interrupt lookat and brain when playAction is called', () => {
    const interruptSpy = vi.spyOn((engine as any).lookAtProcessor, 'interrupt');
    const brainSpy = vi.spyOn((engine as any).brain, 'setIntent');
    
    engine.playAction('wave');
    
    expect(interruptSpy).toHaveBeenCalled();
    expect(brainSpy).toHaveBeenCalledWith({ state: AvatarBehaviorStates.IDLE });
  });

  it('should re-init brain with debug when setDebug is called', () => {
    engine.setDebug(true);
    expect(engine.isDebug).toBe(true);
    // @ts-ignore
    expect(engine.brain.debug).toBe(true);
  });
});