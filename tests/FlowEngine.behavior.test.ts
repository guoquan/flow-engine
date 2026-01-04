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

  it('should process structured AgentResponse correctly', () => {
    vi.useFakeTimers();
    const mockAnimController = {
      play: vi.fn(),
      init: vi.fn(),
      update: vi.fn()
    };
    // @ts-expect-error
    engine.animController = mockAnimController;

    // Test text-only response
    engine.processAgentResponse({ text: 'Hello' });
    // @ts-ignore
    expect(engine.brain.getState()).toBe(AvatarBehaviorStates.TALKING);
    expect(mockAnimController.play).toHaveBeenCalledWith('talk');

    // Test response with explicit state and actions
    engine.processAgentResponse({
      state: AvatarBehaviorStates.EMOTIONAL,
      emotion: 'happy',
      actions: [
        { type: 'animation', name: 'wave' }
      ]
    });
    
    vi.runAllTimers();

    // @ts-ignore
    expect(engine.brain.getState()).toBe(AvatarBehaviorStates.EMOTIONAL);
    expect(mockAnimController.play).toHaveBeenCalledWith('wave');
    
    vi.useRealTimers();
  });

  it('should process AgentResponse with only state or only text', () => {
    // 1. Only state
    engine.processAgentResponse({ state: AvatarBehaviorStates.THINKING });
    // @ts-ignore
    expect(engine.brain.getState()).toBe(AvatarBehaviorStates.THINKING);

    // 2. Only text (defaults to TALKING)
    engine.processAgentResponse({ text: 'Speech only' });
    // @ts-ignore
    expect(engine.brain.getState()).toBe(AvatarBehaviorStates.TALKING);

    // 3. Listening state
    engine.processAgentResponse({ state: AvatarBehaviorStates.LISTENING });
    // @ts-ignore
    expect(engine.brain.getState()).toBe(AvatarBehaviorStates.LISTENING);
  });

  it('should execute interaction commands and handle HOLDING timeout', () => {
    vi.useFakeTimers();
    let currentTime = 1000;
    const perfSpy = vi.spyOn(performance, 'now').mockImplementation(() => currentTime);

    const mockModel = new THREE.Group();
    // @ts-expect-error
    engine.avatarModel = mockModel;
    // @ts-expect-error
    engine.headBone = new THREE.Object3D();
    // @ts-expect-error
    engine.currentAvatarConfig = { name: 'test', modelSrc: '', lookAt: { enabled: true } };

    // @ts-expect-error
    const lookAtSpy = vi.spyOn(engine.lookAtProcessor, 'setTarget');
    const targetPos = new THREE.Vector3(1, 2, 3);

    engine.processAgentResponse({
      actions: [
        { type: 'interaction', name: 'lookAt', value: targetPos },
        { type: 'expression', name: 'smile' } 
      ]
    });

    vi.runAllTimers();
    expect(lookAtSpy).toHaveBeenCalledWith(targetPos);

    // Simulate mouse interaction to enter HOLDING
    // @ts-ignore
    engine.lookAtProcessor.onPointerDown({ clientX: 100, clientY: 100 });
    // @ts-ignore
    engine.lookAtProcessor.onPointerUp();
    
    // @ts-ignore
    expect(engine.lookAtProcessor.state).toBe('HOLDING');

    // Advance time
    currentTime += 5000;
    // @ts-ignore
    engine.lookAtProcessor.update(currentTime, 0.1);
    
    // @ts-ignore
    expect(engine.lookAtProcessor.state).toBe('IDLE');

    perfSpy.mockRestore();
    vi.useRealTimers();
  });

  it('should ignore unknown command types gracefully', () => {
    const consoleSpy = vi.spyOn(console, 'log');
    // @ts-ignore - testing invalid type
    engine.processAgentResponse({
      actions: [{ type: 'unknown', name: 'void' }]
    });
    // Should not crash
    expect(consoleSpy).toHaveBeenCalled();
  });
});
