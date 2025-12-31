import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as THREE from 'three';
import { FlowEngine } from '../src/core/FlowEngine';

// Manually expose THREE to global scope for Vitest to ensure compiled code works
(globalThis as any).THREE = THREE;

describe('FlowEngine', () => {
  let container: HTMLDivElement;
  let mockLoader: any;
  let mockStageLoader: any;
  let mockLookAtProcessor: any;
  let mockControls: any;

  beforeEach(() => {
    document.body.innerHTML = '<div id="container"></div>';
    container = document.getElementById('container') as HTMLDivElement;

    // Create Mocks
    mockLoader = { load: vi.fn() };
    mockStageLoader = { load: vi.fn() };
    mockLookAtProcessor = { 
      update: vi.fn(), 
      interrupt: vi.fn(), 
      getDebugInfo: vi.fn().mockReturnValue({ isEngaged: false }),
      dispose: vi.fn() 
    };
    mockControls = { update: vi.fn(), target: new THREE.Vector3() };
  });

  it('should initialize correctly with injected mocks', () => {
    const engine = new FlowEngine('container', {
      loader: mockLoader,
      stageLoader: mockStageLoader,
      lookAtProcessor: mockLookAtProcessor,
      controls: mockControls
    });
    expect(engine).toBeDefined();
  });

  it('should delegate update to lookAtProcessor', () => {
    const engine = new FlowEngine('container', {
      loader: mockLoader,
      stageLoader: mockStageLoader,
      lookAtProcessor: mockLookAtProcessor,
      controls: mockControls
    });
    const engineInternal = engine as any;
    engineInternal.avatarModel = new THREE.Group();
    
    // We mock the renderer methods that animate calls
    engineInternal.renderer = { render: vi.fn(), setAnimationLoop: vi.fn(), update: vi.fn() };
    
    engineInternal.animate(100);
    expect(mockLookAtProcessor.update).toHaveBeenCalled();
  });
});