import { AvatarBehaviorStates, type AvatarBehaviorState, type BehaviorIntent } from '../types';

/**
 * BehaviorController (The Global Brain)
 * Manages the high-level behavioral state machine of the avatar.
 */
export class BehaviorController {
  private currentState: AvatarBehaviorState = AvatarBehaviorStates.IDLE;
  private stateStartTime: number = 0;
  private stateTimeout: number | null = null;
  private isTransitioning: boolean = false;
  private debug: boolean = false;

  /**
   * Optional callback triggered when the behavioral state changes.
   */
  public onStateChange?: (newState: AvatarBehaviorState, intent: BehaviorIntent) => void;

  /**
   * @param options.debug Enable verbose logging for transitions
   */
  constructor(options?: { debug?: boolean }) {
    this.debug = !!options?.debug;
  }

  /**
   * Drives the brain logic.
   * @param timeMs Consistent external timestamp (usually from requestAnimationFrame).
   */
  public update(timeMs: number) {
    if (this.stateStartTime === 0) this.stateStartTime = timeMs;

    // Handle automatic timeout logic (e.g., auto-reverting to IDLE after speaking)
    if (this.stateTimeout !== null) {
      if (timeMs - this.stateStartTime >= this.stateTimeout) {
        if (this.debug) console.log(`[Brain] State ${this.currentState} timed out, reverting to IDLE.`);
        
        // Clear timeout before triggering transition to avoid cycles
        this.stateTimeout = null;
        this.setIntent({ state: AvatarBehaviorStates.IDLE }, timeMs);
      }
    }
  }

  /**
   * Core API: Submit a behavioral intent to the brain.
   * @param intent The desired behavior change
   * @param timeMs Optional current time (defaults to performance.now())
   */
  public setIntent(intent: BehaviorIntent, timeMs?: number) {
    if (this.isTransitioning) return; // Re-entrancy protection

    // Avoid duplicate entries for standard states
    if (this.currentState === intent.state && intent.state !== AvatarBehaviorStates.EMOTIONAL) {
      return;
    }

    const now = timeMs ?? performance.now();
    if (this.debug) console.log(`[Brain] Transition: ${this.currentState} -> ${intent.state}`);
    
    this.isTransitioning = true;
    try {
      this.currentState = intent.state;
      this.stateStartTime = now;
      this.stateTimeout = intent.duration ?? null;

      if (this.onStateChange) {
        this.onStateChange(this.currentState, intent);
      }
    } finally {
      this.isTransitioning = false;
    }
  }

  /**
   * @returns The current high-level behavior state.
   */
  public getState(): AvatarBehaviorState {
    return this.currentState;
  }
}
