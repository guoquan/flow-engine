# Animation Configuration Guide / 动画配置指南

[English](#english) | [中文](#中文)

---

## English

The Flow engine uses a declarative animation state machine managed via the `animations` field in `config.json`.

### Data Structure (TypeScript)

```typescript
export interface AnimationStateConfig {
  clipName: string;      // Original clip name in GLB
  loop?: boolean;        // Whether the animation should loop
  next?: string;         // Next state to transition to automatically
  fadeDuration?: number; // Cross-fade duration in seconds
  timeScale?: number;    // Playback speed multiplier
  holdDuration?: number; // Time to stay on the last frame before transition (seconds)
}
```

### Logic Details
1. **Fuzzy Matching**: If `clipName` doesn't match exactly, the engine tries case-insensitive or partial matching.
2. **Auto-Return**: If a state is not looping and has a `next` state defined, it will transition after `holdDuration`.

---

## 中文

Flow 引擎采用声明式的动画状态机管理方案。通过配置 `config.json` 中的 `animations` 字段来驱动角色行为。

### 数据结构 (TypeScript)

```typescript
export interface AnimationStateConfig {
  clipName: string;      // GLB 中的原始动画片段名称
  loop?: boolean;        // 是否循环
  next?: string;         // 播放完后自动跳转的状态 (如: wave -> idle)
  fadeDuration?: number; // 状态切换时的淡入淡出时间 (秒)
  timeScale?: number;    // 播放速度 (1.0 为原始速度)
  holdDuration?: number; // 播放完后在最后一帧停留的时间 (秒)
}
```

### 逻辑细节
1. **模糊匹配**: 如果 `clipName` 不完全匹配，引擎会尝试忽略大小写或包含匹配。
2. **自动归位**: 如果一个状态非循环且定义了 `next`，引擎会在播放结束并停留 `holdDuration` 后自动跳转。