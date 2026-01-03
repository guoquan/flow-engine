/**
 * High-level Behavior States for the Agent Brain
 */
export const AvatarBehaviorStates = {
  IDLE: 'IDLE',
  TALKING: 'TALKING',
  THINKING: 'THINKING',
  LISTENING: 'LISTENING',
  EMOTIONAL: 'EMOTIONAL'
} as const;

export type AvatarBehaviorState = typeof AvatarBehaviorStates[keyof typeof AvatarBehaviorStates];

/**
 * Encapsulates an intent to change the avatar's high-level behavior.
 * 
 * This intent is typically forwarded to an `onStateChange` callback where 
 * consumers (like AnimationController or Text-to-Speech) can react.
 */
export interface BehaviorIntent {
  /** Target high-level behavior state for the avatar. */
  state: AvatarBehaviorState;
  
  /** 
   * What is being said when the state is `TALKING`. 
   * Useful for lip-sync, subtitles, or speech synthesis.
   */
  text?: string;
  
  /** 
   * The current mood when the state is `EMOTIONAL`. 
   * Used to select appropriate facial expressions or emotional animations.
   */
  emotion?: string;
  
  /** 
   * Optional timeout for the state in milliseconds. 
   * The brain will automatically revert to `IDLE` after this duration.
   */
  duration?: number;
}

/**
 * Interface for autonomous behavior components
 */
export interface InteractionProcessor {
  update(timeMs: number, delta: number): void;
  dispose(): void;
}

export interface AvatarConfig {
  name: string;
  modelSrc: string;
  scale?: number;
  initialPosition?: [number, number, number];
  /** Interaction: Look at target settings */
  lookAt?: {
    enabled?: boolean;
    headBoneName?: string;
    /** Euler angles offset in radians [x, y, z] to align eyes to front */
    rotationOffset?: [number, number, number];
    /** How fast the head turns (0-1) */
    lerpFactor?: number;
    /** How long to stay looking before returning (ms) */
    holdDuration?: number;
    /** Smoothing damping factor (typical 5-10) */
    damping?: number;
  };
  /** Animation State Machine Configuration */
  animations?: {
    defaultState: string;
    states: Record<string, AnimationStateConfig>;
  };
}

export interface AnimationStateConfig {
  /** The exact name of the clip in the GLB (fuzzy matching supported if not found) */
  clipName: string;
  /** Whether the animation should loop */
  loop?: boolean;
  /** The state to transition to after this one finishes (for non-looping) */
  next?: string;
  /** Cross-fade duration in seconds (default: 0.3) */
  fadeDuration?: number;
  /** Time scale (speed), default 1.0 */
  timeScale?: number;
  /** Duration to hold the last frame before transitioning (seconds) */
  holdDuration?: number;
}

export interface StageConfig {
  name: string;
  modelSrc?: string; // Optional, if omitted, generate a procedural placeholder
  scale?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  /** Animation logic for the stage (e.g. rotating, rising) */
  animations?: {
    defaultState: string;
    states: Record<string, AnimationStateConfig>;
  };
}
