import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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

  afterEach(() => {
    vi.restoreAllMocks();
    if (container && container.parentNode) {
      document.body.removeChild(container);
    }
  });

  it('should expose behavior methods', () => {
    expect(engine.say).toBeDefined();
    expect(engine.think).toBeDefined();
    expect(engine.setBehavior).toBeDefined();
  });

  it('should trigger animation when brain state changes', async () => {
    const mockModel = new THREE.Group();
    const mockAnimController = {
      play: vi.fn(),
      init: vi.fn(),
      update: vi.fn()
    };
    
    // @ts-expect-error Accessing private members for test
    engine.avatarModel = mockModel;
    // @ts-expect-error
    engine.animController = mockAnimController;

    engine.say('Hello');
    expect(mockAnimController.play).toHaveBeenCalledWith('talk');

    engine.think();
    expect(mockAnimController.play).toHaveBeenCalledWith('thinking');

    engine.setBehavior({ state: AvatarBehaviorStates.IDLE });
    expect(mockAnimController.play).toHaveBeenCalledWith('idle');
  });

  it('should interrupt lookat and brain when playAction is called', () => {
    // @ts-expect-error
    const interruptSpy = vi.spyOn(engine.lookAtProcessor, 'interrupt');
    // @ts-expect-error
    const brainSpy = vi.spyOn(engine.brain, 'setIntent');
    
    engine.playAction('wave');
    
    expect(interruptSpy).toHaveBeenCalled();
    expect(brainSpy).toHaveBeenCalledWith({ state: AvatarBehaviorStates.IDLE });
  });

  it('should update brain debug mode when setDebug is called', () => {
    engine.setDebug(true);
    expect(engine.isDebug).toBe(true);
    // @ts-expect-error
    expect(engine.brain.isDebugEnabled()).toBe(true);

    engine.setDebug(false);
    // @ts-expect-error
    expect(engine.brain.isDebugEnabled()).toBe(false);
  });
});
