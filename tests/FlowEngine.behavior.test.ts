import { describe, it, expect, vi, beforeEach } from 'vitest';
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

  it('should change brain state when calling say()', () => {
    engine.say('Hello');
    // @ts-ignore
    expect(engine.brain.getState()).toBe(AvatarBehaviorStates.TALKING);
  });

  it('should change brain state when calling think()', () => {
    engine.think();
    // @ts-ignore
    expect(engine.brain.getState()).toBe(AvatarBehaviorStates.THINKING);
  });
});
