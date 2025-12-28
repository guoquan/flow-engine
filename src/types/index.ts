/**
 * Avatar Configuration Interface
 * 定义数字人的元数据结构，对应资源包中的 config.json
 */
export interface AvatarConfig {
  name: string;
  modelSrc: string;
  scale?: number;
  initialPosition?: [number, number, number];
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
