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

## 📝 Coding Standards

- **Strict Typing**: No `any`. Use `import type` for interfaces to support Vite/TSC build constraints.
- **Cross-Fade**: Always use `fadeIn/fadeOut` for state transitions to ensure visual smoothness.
- **Pure Frontend**: No external server required for Demo. Logic is local in `main.ts`.

---
*Motto: Modern, Data-Driven, Fast.*
