import { AvatarBehaviorStates, type AvatarBehaviorState, type BehaviorIntent } from '../types';

/**
 * BehaviorController (The Global Brain)
 * 负责管理数字人的高层行为状态机。
 */
export class BehaviorController {
  private currentState: AvatarBehaviorState = AvatarBehaviorStates.IDLE;
  private stateStartTime: number = 0;
  private stateTimeout: number | null = null;
  private isTransitioning: boolean = false;

  // 回调：当状态改变时通知外部或反射系统
  public onStateChange?: (newState: AvatarBehaviorState, intent: BehaviorIntent) => void;

  constructor() {
    // 初始状态开始时间将在第一次 update 或 setIntent 时更新
  }

  /**
   * 驱动大脑运行
   * @param timeMs 外部传入的一致性时间戳 (通常来自 requestAnimationFrame)
   */
  public update(timeMs: number) {
    if (this.stateStartTime === 0) this.stateStartTime = timeMs;

    // 处理自动超时逻辑 (例如：THINKING 状态 3秒后自动回到 IDLE)
    if (this.stateTimeout !== null) {
      if (timeMs - this.stateStartTime >= this.stateTimeout) {
        console.log(`[Brain] State ${this.currentState} timed out, reverting to IDLE.`);
        // 在触发状态切换前清除超时，防止在 IDLE 状态下循环触发
        this.stateTimeout = null;
        this.setIntent({ state: AvatarBehaviorStates.IDLE }, timeMs);
      }
    }
  }

  /**
   * 核心 API：向大脑发送一个“意图”
   * @param intent 行为意图
   * @param timeMs 可选的当前时间，如果不传则使用 performance.now()
   */
  public setIntent(intent: BehaviorIntent, timeMs?: number) {
    if (this.isTransitioning) return; // 重入保护

    if (this.currentState === intent.state && intent.state !== AvatarBehaviorStates.EMOTIONAL) {
      return; // 避免重复进入同一状态
    }

    const now = timeMs ?? performance.now();
    console.log(`[Brain] Transition: ${this.currentState} -> ${intent.state}`);
    
    this.isTransitioning = true;
    try {
      this.currentState = intent.state;
      this.stateStartTime = now;
      // 使用 nullish coalescing 支持 duration: 0
      this.stateTimeout = intent.duration ?? null;

      if (this.onStateChange) {
        this.onStateChange(this.currentState, intent);
      }
    } finally {
      this.isTransitioning = false;
    }
  }

  public getState(): AvatarBehaviorState {
    return this.currentState;
  }
}
