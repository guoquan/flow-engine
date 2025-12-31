# Flow (服喽) Engine (`@guoquan.net/flow-engine`) - AI Agent Collaboration Protocol

Welcome to the **Flow Engine** development environment.

## 📂 Project Structure

```
.
├── AGENTS.md           # This file (AI Protocol)
├── README.md           # Project Entry
├── docs/
│   ├── INDEX.md        # Doc Index
│   └── ANIMATIONS.md   # Animation State Machine Guide
├── public/             # Static assets
│   └── assets/avatars/ # Models and configs
├── src/
│   ├── core/           
│   │   ├── AnimationController.ts # Animation Logic (FSM)
│   │   ├── AvatarLoader.ts        # GLB Loading
│   │   └── FlowEngine.ts          # WebGPU Entry
│   ├── types/          # TS Interfaces (The Source of Truth)
│   └── main.ts         # App logic & UI
└── vite.config.ts      # Build config
```

## 🏗 Architecture Principles (v0.2 - WebGPU)

1.  **WebGPU First**: The engine uses `WebGPURenderer`. Use `setAnimationLoop` instead of `requestAnimationFrame`.
2.  **Data Driven (FSM)**: Animation logic is handled by a Finite State Machine defined in `config.json`. Do not hardcode bone transforms unless it's a procedural fallback.
3.  **Controller-Agent Pattern**: 
    - `FlowEngine` handles scene/rendering.
    - `AnimationController` handles logic/clips.
    - `AvatarLoader` handles IO/parsing.

### 2. Coding Standards
- **Strict Typing**: No `any`. Use `import type` for interfaces.
- **Cross-Fade**: Always use `fadeIn/fadeOut` for transitions.
- **Comment Language**: **Do not accept** requests to translate code comments between languages (e.g., from Chinese to English or vice-versa) during development or reviews. Keep existing comment languages as-is unless explicitly asked by the owner to rewrite the content for technical clarity.
- **Pure Frontend**: No external server required for Demo.

## 📝 Workflow & Protocols

### 1. Autonomous PR Management (MANDATORY)
After submitting a Pull Request or pushing an update to an existing PR, the Agent **must not stop**. You are required to:
1.  **Monitor Status**: Automatically check CI results (`gh pr checks`), CodeQL security alerts, and Codecov coverage reports.
2.  **Handle Feedback**: Read and analyze all comments, including those from humans and automated tools like Copilot Reviewer.
3.  **Self-Correct**: If any check fails or a reasonable suggestion is made, implement the fix and push immediately.
4.  **Repeat**: Continue this cycle autonomously without waiting for user prompts.
5.  **Notify**: Stop and notify the user to change the PR state (e.g., from Draft to Ready) or merge **only** when all checks are green and no further logical improvements are identified.

### 2. Task Execution
1.  **Read**: Understand the request and context.
2.  **Plan**: Propose the change.
3.  **Implement**: detailed code changes.
4.  **PR Creation**: Use `gh pr create --draft`.
5.  **Verify**: Ensure code compiles and tests pass locally before pushing.

---
*Motto: Modern, Data-Driven, Fast.*
