/**
 * Avatar Configuration Interface
 * 定义数字人的元数据结构，对应资源包中的 config.json
 */
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
