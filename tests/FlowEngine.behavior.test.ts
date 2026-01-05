import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as THREE from 'three';
import { FlowEngine } from '../src/core/FlowEngine';
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
    
    // @ts-expect-error: assigning mock model to private avatarModel
    engine.avatarModel = mockModel;
    // @ts-expect-error: assigning mock controller to private animController
    engine.animController = mockAnimController;

    engine.say('Hello');
    expect(mockAnimController.play).toHaveBeenCalledWith('talk');

    // Test object style say
    engine.say({ text: 'Hello Object', duration: 5000 });
    expect(mockAnimController.play).toHaveBeenCalledWith('talk');

    engine.think();
    expect(mockAnimController.play).toHaveBeenCalledWith('thinking');

    // Test object style think
    engine.think({ text: 'Thinking Object', duration: 2000 });
    expect(mockAnimController.play).toHaveBeenCalledWith('thinking');

    engine.setBehavior({ state: AvatarBehaviorStates.IDLE });
    expect(mockAnimController.play).toHaveBeenCalledWith('idle');
  });

  it('should interrupt lookat and brain when playAction is called', () => {
    // @ts-expect-error: spying on private lookAtProcessor
    const interruptSpy = vi.spyOn(engine.lookAtProcessor, 'interrupt');
    // @ts-expect-error: spying on private brain
    const brainSpy = vi.spyOn(engine.brain, 'setIntent');
    
    engine.playAction('wave');
    
    expect(interruptSpy).toHaveBeenCalled();
    expect(brainSpy).toHaveBeenCalledWith({ state: AvatarBehaviorStates.IDLE });
  });

  it('should update brain debug mode when setDebug is called', () => {
    engine.setDebug(true);
    expect(engine.isDebug).toBe(true);
    // @ts-expect-error: accessing internal brain method
    expect(engine.brain.isDebugEnabled()).toBe(true);

    engine.setDebug(false);
    // @ts-expect-error: accessing internal brain method
    expect(engine.brain.isDebugEnabled()).toBe(false);
  });

  it('should process structured AgentResponse correctly', () => {
    vi.useFakeTimers();
    const mockAnimController = {
      play: vi.fn(),
      init: vi.fn(),
      update: vi.fn()
    };
    // @ts-expect-error: inject mock controller
    engine.animController = mockAnimController;

    // Test text-only response
    engine.processAgentResponse({ text: 'Hello' });
    // @ts-expect-error: access private brain
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

    // @ts-expect-error: access private brain
    expect(engine.brain.getState()).toBe(AvatarBehaviorStates.EMOTIONAL);
    expect(mockAnimController.play).toHaveBeenCalledWith('wave');
    
    vi.useRealTimers();
  });

  it('should process AgentResponse with only state or only text', () => {
    // 1. Only state
    engine.processAgentResponse({ state: AvatarBehaviorStates.THINKING });
    // @ts-expect-error: access private brain
    expect(engine.brain.getState()).toBe(AvatarBehaviorStates.THINKING);

    // 2. Only text (defaults to TALKING)
    engine.processAgentResponse({ text: 'Speech only' });
    // @ts-expect-error: access private brain
    expect(engine.brain.getState()).toBe(AvatarBehaviorStates.TALKING);

    // 3. Listening state
    engine.processAgentResponse({ state: AvatarBehaviorStates.LISTENING });
    // @ts-expect-error: access private brain
    expect(engine.brain.getState()).toBe(AvatarBehaviorStates.LISTENING);
  });

  it('should execute interaction commands and handle HOLDING timeout', () => {
    vi.useFakeTimers();
    let currentTime = 1000;
    const perfSpy = vi.spyOn(performance, 'now').mockImplementation(() => currentTime);

    const mockModel = new THREE.Group();
    // @ts-expect-error: inject test doubles
    engine.avatarModel = mockModel;
    // @ts-expect-error
    engine.headBone = new THREE.Object3D();
    // @ts-expect-error
    engine.currentAvatarConfig = { name: 'test', modelSrc: '', lookAt: { enabled: true } };

    // @ts-expect-error: spy on private processor
    const lookAtSpy = vi.spyOn(engine.lookAtProcessor, 'setTarget');
    const targetPos = new THREE.Vector3(1, 2, 3);

    engine.processAgentResponse({
      actions: [
        { type: 'interaction', name: 'lookAt', value: targetPos },
        { type: 'expression', name: 'smile' } 
      ]
    });

    vi.runAllTimers();
    expect(lookAtSpy).toHaveBeenCalledWith(expect.any(THREE.Vector3));

    // Simulate mouse interaction to enter HOLDING
    // @ts-expect-error: trigger private event handler
    engine.lookAtProcessor.onPointerDown({ clientX: 100, clientY: 100 });
    // @ts-expect-error
    engine.lookAtProcessor.onPointerUp();
    
    // @ts-expect-error: verify private state
    expect(engine.lookAtProcessor.state).toBe('HOLDING');

    // Advance time
    currentTime += 5000;
    // @ts-expect-error: trigger update
    engine.lookAtProcessor.update(currentTime, 0.1);
    
    // @ts-expect-error: verify final state
    expect(engine.lookAtProcessor.state).toBe('IDLE');

    perfSpy.mockRestore();
    vi.useRealTimers();
  });

  it('should ignore unknown command types gracefully', () => {
    vi.useFakeTimers();
    const consoleSpy = vi.spyOn(console, 'warn');
    // @ts-expect-error: testing invalid type payload
    engine.processAgentResponse({
      actions: [{ type: 'unknown', name: 'void' }]
    });
    
    vi.runAllTimers();
    // Should log warning
    expect(consoleSpy).toHaveBeenCalled();
    expect(consoleSpy.mock.calls[0][0]).toContain('Unknown action command type');
    vi.useRealTimers();
  });

  it('should reject invalid response objects', () => {
    const consoleSpy = vi.spyOn(console, 'warn');
    // @ts-expect-error: testing invalid input
    engine.processAgentResponse(null);
    expect(consoleSpy).toHaveBeenCalled();
    expect(consoleSpy.mock.calls[0][0]).toContain('Invalid AgentResponse');
  });
});