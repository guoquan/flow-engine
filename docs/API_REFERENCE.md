# 📚 Flow Engine API Reference / API 参考文档

[English](#english) | [中文](#中文)

---

## English

This document details the core TypeScript API for controlling the `FlowEngine` instance directly in the browser.

### Core Class: `FlowEngine`

#### Initialization
```typescript
import { FlowEngine } from '@guoquan/flow-engine';

const engine = new FlowEngine('container-id');
await engine.loadAvatar('/path/to/avatar.config.json');
```

---

### 🧠 Behavior API
These methods are the primary way to drive the avatar. They utilize the **Schema-First** architecture, meaning they share definitions with our MCP tools.

#### `say(params)`
Makes the avatar speak. Transitions the internal state machine to `TALKING`.

**Signature:**
```typescript
say(params: string | { text: string; duration?: number }): void
```

**Parameters:**
*   `text` (Required): The string content to display in the speech bubble.
*   `duration` (Optional): Time in milliseconds to remain in the talking state. Defaults to `3000`.

**Examples:**
```typescript
// Simple string
engine.say("Hello world!");

// Object with options
engine.say({ 
  text: "I am explaining a complex topic.", 
  duration: 10000 
});
```

---

#### `think(params)`
Makes the avatar enter a thinking state. Transitions to `THINKING`.

**Signature:**
```typescript
think(params?: string | { text?: string; duration?: number }): void
```

**Parameters:**
*   `text` (Optional): The content of the thought bubble. Defaults to `...`.
*   `duration` (Optional): Time in milliseconds. Defaults to `3000`.

**Examples:**
```typescript
// Default (displays "...")
engine.think();

// Custom thought
engine.think("Calculating trajectory...");

// Object style
engine.think({ text: "Hmm...", duration: 5000 });
```

---

#### `playAction(actionName)`
Directly triggers a low-level animation state, bypassing some high-level behavior logic. Useful for specific gestures like waving or bowing.

**Signature:**
```typescript
playAction(action: string): void
```

**Examples:**
```typescript
engine.playAction('wave');
engine.playAction('dance');
```

---

### ⚙️ Configuration Schemas
The engine uses Zod schemas to validate inputs internally.

While the concrete schema types exist inside the library, they are currently not exported as part of the public API. Instead, you can rely on the method signatures or derive types using TypeScript's utility types:

```typescript
import type { FlowEngine } from '@guoquan/flow-engine';

// Derive parameter types from the engine methods
type SayParams = Parameters<FlowEngine['say']>[0];
type ThinkParams = Parameters<FlowEngine['think']>[0];
```

---

## 中文

本文档详细介绍了用于在浏览器中直接控制 `FlowEngine` 实例的核心 TypeScript API。

### 核心类: `FlowEngine`

#### 初始化
```typescript
import { FlowEngine } from '@guoquan/flow-engine';

const engine = new FlowEngine('container-id');
await engine.loadAvatar('/path/to/avatar.config.json');
```

---

### 🧠 行为 API (Behavior API)
这些方法是驱动数字人的主要方式。它们采用了 **Schema-First (模式优先)** 架构，这意味着它们与我们的 MCP 工具共享定义。

#### `say(params)`
让数字人说话。将内部状态机切换为 `TALKING`。

**签名:**
```typescript
say(params: string | { text: string; duration?: number }): void
```

**参数:**
*   `text` (必填): 显示在气泡中的文本内容。
*   `duration` (可选): 保持说话状态的时长 (毫秒)。默认为 `3000`。

**示例:**
```typescript
// 简单字符串
engine.say("你好，世界！");

// 带选项的对象
engine.say({ 
  text: "我现在正在解释一个复杂的概念。", 
  duration: 10000 
});
```

---

#### `think(params)`
让数字人进入思考状态。将状态机切换为 `THINKING`。

**签名:**
```typescript
think(params?: string | { text?: string; duration?: number }): void
```

**参数:**
*   `text` (可选): 思考气泡的内容。默认为 `...`。
*   `duration` (可选): 保持思考状态的时长 (毫秒)。默认为 `3000`。

**示例:**
```typescript
// 默认 (显示 "...")
engine.think();

// 自定义思考内容
engine.think("正在计算轨迹...");

// 对象式调用
engine.think({ text: "Hmm...", duration: 5000 });
```

---

#### `playAction(actionName)`
直接触发底层的动画状态，绕过部分高级行为逻辑。适用于特定的手势，如挥手或鞠躬。

**签名:**
```typescript
playAction(action: string): void
```

**示例:**
```typescript
engine.playAction('wave');
engine.playAction('dance');
```

---

### ⚙️ 配置模式 (Schemas)
引擎使用 Zod 模式来验证输入。您可以通过 `FlowEngine` 方法签名来推导参数类型，从而获得 TypeScript 类型安全：

```typescript
import type { FlowEngine } from '@guoquan/flow-engine';

// 从引擎方法推导参数类型
type SayParams = Parameters<FlowEngine['say']>[0];
type ThinkParams = Parameters<FlowEngine['think']>[0];
```
