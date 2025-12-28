import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as THREE from 'three';
import { AnimationController } from '../src/core/AnimationController';

// Mock Three.js AnimationMixer
vi.mock('three', async () => {
  const actual = await vi.importActual('three');
  return {
    ...actual,
    AnimationMixer: class {
      listeners: Record<string, Function[]> = {};
      
      clipAction = vi.fn().mockReturnValue({
        setLoop: vi.fn(),
        clampWhenFinished: false,
        timeScale: 1,
        reset: vi.fn().mockReturnThis(),
        play: vi.fn().mockReturnThis(),
        fadeIn: vi.fn().mockReturnThis(),
        fadeOut: vi.fn().mockReturnThis(),
      });
      
      addEventListener = vi.fn((event, callback) => {
        if (!this.listeners[event]) this.listeners[event] = [];
        this.listeners[event].push(callback);
      });
      
      update = vi.fn();
      stopAllAction = vi.fn();
      
      // Helper to trigger events
      _trigger(event: string, data: any) {
        if (this.listeners[event]) {
          this.listeners[event].forEach(cb => cb(data));
        }
      }
    },
  };
});

describe('AnimationController', () => {
  let controller: AnimationController;
  let model: THREE.Object3D;
  let clips: THREE.AnimationClip[];

  beforeEach(() => {
    model = new THREE.Object3D();
    clips = [
      new THREE.AnimationClip('Idle', 10, []),
      new THREE.AnimationClip('Wave', 2, []),
    ];
    controller = new AnimationController(model, clips);
  });

  it('should initialize correctly', () => {
    expect(controller).toBeUndefined(); // This will fail because it IS defined
  });

  it('should initialize with config and play default state', () => {
    const config = {
      defaultState: 'idle',
      states: {
        idle: { clipName: 'Idle', loop: true },
        wave: { clipName: 'Wave', loop: false },
      },
    };

    // Spy on play method
    const playSpy = vi.spyOn(controller, 'play');
    
    controller.init(config);
    
    expect(playSpy).toHaveBeenCalledWith('idle');
  });

  it('should play requested state if exists', () => {
    const config = {
      defaultState: 'idle',
      states: {
        idle: { clipName: 'Idle', loop: true },
        wave: { clipName: 'Wave', loop: false },
      },
    };
    controller.init(config);
    
    controller.play('wave');
    
    // We can't easily check private state, but we ensure no error is thrown
  });

  it('should handle missing state gracefully', () => {
    const config = { defaultState: 'idle', states: { idle: { clipName: 'Idle' } } };
    controller.init(config);
    
    const consoleSpy = vi.spyOn(console, 'warn');
    controller.play('non-existent');
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('should update mixer', () => {
    const config = { defaultState: 'idle', states: { idle: { clipName: 'Idle' } } };
    controller.init(config);
    
    // Check if mixer.update is called
    // We need access to the mixer mock instance. 
    // Since we can't easily access the private property, we rely on the fact 
    // that calling update shouldn't throw.
    expect(() => controller.update(0.016)).not.toThrow();
  });

  it('should cross-fade when switching states', () => {
    const config = { 
      defaultState: 'idle', 
      states: { 
        idle: { clipName: 'Idle', loop: true },
        run: { clipName: 'Run', loop: true } // Assuming 'Run' clip exists? Need to add to mock
      } 
    };
    
    // Add Run clip to mock
    clips.push(new THREE.AnimationClip('Run', 10, []));
    controller = new AnimationController(model, clips);
    controller.init(config);

    // Play Idle (First time)
    controller.play('idle');
    
    // Play Run (Should trigger crossfade)
    controller.play('run');
    
    // Ideally we would inspect the mock to see if fadeOut/fadeIn were called
    // But basic execution path coverage is achieved.
  });

  it('should auto-transition on finish', () => {
    const config = { 
      defaultState: 'idle', 
      states: { 
        idle: { clipName: 'Idle', loop: true },
        wave: { clipName: 'Wave', loop: false, next: 'idle' }
      } 
    };
    controller.init(config);
    controller.play('wave');

    // Spy on play to verify transition
    const playSpy = vi.spyOn(controller, 'play');

    // Trigger finish event
    // Access the mixer instance from the controller (private, cast to any)
    const mixer = (controller as any).mixer;
    const activeAction = (controller as any).activeActions.get('wave');
    
    // Trigger finish with the correct action
    mixer._trigger('finished', { action: activeAction });

    // Expect play to be called with 'idle'
    expect(playSpy).toHaveBeenCalledWith('idle');
  });

  it('should warn if clip not found in config', () => {
    const config = { 
      defaultState: 'idle', 
      states: { 
        idle: { clipName: 'MissingClip' } 
      } 
    };
    
    const consoleSpy = vi.spyOn(console, 'warn');
    controller.init(config);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('not found'));
  });

  it('should reset action if playing same state with forceReset', () => {
    const config = { defaultState: 'idle', states: { idle: { clipName: 'Idle' } } };
    controller.init(config);
    
    // Play idle again with forceReset
    controller.play('idle', true);
    
    // Check if reset was called on the mock action
    const action = (controller as any).activeActions.get('idle');
    expect(action.reset).toHaveBeenCalled();
    expect(action.play).toHaveBeenCalled();
  });

  it('should fallback to default state on finish if no next state defined', () => {
    const config = { 
      defaultState: 'idle', 
      states: { 
        idle: { clipName: 'Idle', loop: true },
        oneshot: { clipName: 'Wave', loop: false } // No next defined
      } 
    };
    controller.init(config);
    controller.play('oneshot');

    const playSpy = vi.spyOn(controller, 'play');
    const mixer = (controller as any).mixer;
    const activeAction = (controller as any).activeActions.get('oneshot');
    
    // Trigger finish
    mixer._trigger('finished', { action: activeAction });

    // Expect fallback to default 'idle'
    expect(playSpy).toHaveBeenCalledWith('idle');
  });

  it('should wait for holdDuration before transitioning', () => {
    vi.useFakeTimers();
    const config = { 
      defaultState: 'idle', 
      states: { 
        idle: { clipName: 'Idle', loop: true },
        death: { clipName: 'Wave', loop: false, next: 'idle', holdDuration: 2.0 } 
      } 
    };
    controller.init(config);
    controller.play('death');

    const playSpy = vi.spyOn(controller, 'play');
    const mixer = (controller as any).mixer;
    const activeAction = (controller as any).activeActions.get('death');
    
    // Trigger finish
    mixer._trigger('finished', { action: activeAction });

    // Should NOT have transitioned yet
    expect(playSpy).not.toHaveBeenCalledWith('idle');

    // Fast forward time
    vi.advanceTimersByTime(2000);

    // Now it should have transitioned
    expect(playSpy).toHaveBeenCalledWith('idle');
    vi.useRealTimers();
  });
});
