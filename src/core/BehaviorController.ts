import { AvatarBehaviorState, type BehaviorIntent } from '../types';

/**
 * BehaviorController (The Global Brain)
 * 负责管理数字人的高层行为状态机。
 */
export class BehaviorController {
  private currentState: AvatarBehaviorState = AvatarBehaviorState.IDLE;
  private stateStartTime: number = 0;
  private stateTimeout: number | null = null;

  // 回调：当状态改变时通知外部或反射系统
  public onStateChange?: (newState: AvatarBehaviorState, intent: BehaviorIntent) => void;

  constructor() {
    this.stateStartTime = performance.now();
  }

  public update(timeMs: number) {
    // 处理自动超时逻辑 (例如：THINKING 状态 3秒后自动回到 IDLE)
    if (this.stateTimeout !== null) {
      if (timeMs - this.stateStartTime > this.stateTimeout) {
        console.log(`[Brain] State ${this.currentState} timed out, reverting to IDLE.`);
        this.setIntent({ state: AvatarBehaviorState.IDLE });
      }
    }
  }

  /**
   * 核心 API：向大脑发送一个“意图”
   */
  public setIntent(intent: BehaviorIntent) {
    if (this.currentState === intent.state && intent.state !== AvatarBehaviorState.EMOTIONAL) {
      return; // 避免重复进入同一状态
    }

    console.log(`[Brain] Transition: ${this.currentState} -> ${intent.state}`);
    
    this.currentState = intent.state;
    this.stateStartTime = performance.now();
    this.stateTimeout = intent.duration || null;

    if (this.onStateChange) {
      this.onStateChange(this.currentState, intent);
    }
  }

  public getState(): AvatarBehaviorState {
    return this.currentState;
  }
}
