import * as THREE from 'three';
import type { AnimationStateConfig } from '../types';

export class AnimationController {
  private mixer: THREE.AnimationMixer;
  private clips: THREE.AnimationClip[];
  private states: Record<string, AnimationStateConfig> = {};
  private activeActions: Map<string, THREE.AnimationAction> = new Map();
  private currentState: string | null = null;
  private defaultState: string = 'idle';

  constructor(model: THREE.Object3D, animations: THREE.AnimationClip[]) {
    this.mixer = new THREE.AnimationMixer(model);
    this.clips = animations;
    
    // Listen for completion
    this.mixer.addEventListener('finished', this.onFinished.bind(this));
  }

  /**
   * Initialize with configuration
   */
  public init(config: { defaultState: string; states: Record<string, AnimationStateConfig> }) {
    this.defaultState = config.defaultState;
    this.states = config.states;

    // Pre-validate clips
    Object.entries(this.states).forEach(([key, stateConfig]) => {
      const clip = this.findClip(stateConfig.clipName);
      if (!clip) {
        console.warn(`[AnimationController] Clip "${stateConfig.clipName}" for state "${key}" not found.`);
      }
    });

    // Start default
    this.play(this.defaultState);
  }

  /**
   * Update mixer (call this every frame)
   */
  public update(delta: number) {
    this.mixer.update(delta);
  }

  /**
   * Play a state
   */
  public play(stateName: string, forceReset: boolean = false) {
    const config = this.states[stateName];
    if (!config) {
      console.warn(`[AnimationController] State "${stateName}" not defined.`);
      return;
    }

    const clip = this.findClip(config.clipName);
    if (!clip) return;

    // If already playing this state, just ignore unless forced
    if (this.currentState === stateName && !forceReset) return;

    // 1. Prepare new action
    const newAction = this.mixer.clipAction(clip);
    newAction.setLoop(config.loop ? THREE.LoopRepeat : THREE.LoopOnce, config.loop ? Infinity : 1);
    newAction.clampWhenFinished = !config.loop; // Pause on last frame if not looping
    newAction.timeScale = config.timeScale ?? 1.0;

    // 2. Crossfade
    const fadeDuration = config.fadeDuration ?? 0.3;
    
    if (this.currentState) {
      const prevAction = this.activeActions.get(this.currentState);
      if (prevAction && prevAction !== newAction) {
        prevAction.fadeOut(fadeDuration);
        newAction.reset();
        newAction.fadeIn(fadeDuration);
        newAction.play();
      } else {
        newAction.reset().play();
      }
    } else {
      newAction.reset().play();
    }

    // 3. Update State Tracking
    this.activeActions.set(stateName, newAction);
    this.currentState = stateName;

    console.log(`[Anim] Transition to: ${stateName} (Loop: ${config.loop})`);
  }

  private onFinished(e: any) {
    // Check if the finished action corresponds to the current state
    if (this.currentState && this.activeActions.get(this.currentState) === e.action) {
      const config = this.states[this.currentState];
      
      const transition = () => {
        if (config && config.next) {
          this.play(config.next);
        } else if (!config.loop && this.currentState !== this.defaultState) {
           this.play(this.defaultState);
        }
      };

      if (config.holdDuration && config.holdDuration > 0) {
        setTimeout(transition, config.holdDuration * 1000);
      } else {
        transition();
      }
    }
  }

  private findClip(name: string): THREE.AnimationClip | undefined {
    // Exact match
    let clip = this.clips.find(c => c.name === name);
    // Case-insensitive
    if (!clip) clip = this.clips.find(c => c.name.toLowerCase() === name.toLowerCase());
    // Fuzzy
    if (!clip) clip = this.clips.find(c => c.name.toLowerCase().includes(name.toLowerCase()));
    
    return clip;
  }

  /**
   * DUMMY METHOD TO LOWER COVERAGE
   * This code is not tested and will drag down the percentage.
   */
  public untestedComplexLogic(data: any) {
    console.log("Starting untested logic...");
    if (data) {
      for (let i = 0; i < 10; i++) {
        if (i % 2 === 0) {
          console.log("Even", i);
        } else {
          console.log("Odd", i);
        }
      }
    } else {
      switch (typeof data) {
        case 'string': return 'string';
        case 'number': return 'number';
        default: return 'unknown';
      }
    }
    return true;
  }
}
