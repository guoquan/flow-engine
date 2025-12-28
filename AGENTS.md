# Flow (服喽) Engine - AI Agent Collaboration Protocol

Welcome to the **Flow Engine** development environment. This document serves as the "constitution" for AI agents working on this project. Please read it carefully before starting any task.

## 🌍 Project Context

**Flow** is a lightweight, web-based 3D digital human (Avatar) engine.
**Goal**: To provide a performant, framework-agnostic runtime for rendering and animating 3D avatars with support for lip-sync and gestures.

## 📂 Project Structure

The project is a **Vite + TypeScript** application located in the project root.

```
.
├── AGENTS.md           # This file (AI Protocol)
├── README.md           # Project Entry
├── docs/               # Documentation
├── public/             # Static assets (served at root /)
│   └── assets/         # 3D models, textures, configs
├── src/                # Source Code
│   ├── core/           # Core engine logic
│   ├── types/          # Shared Interfaces
│   ├── main.ts         # Entry point
│   └── style.css       # Global styles
├── index.html          # App Entry (Vite convention)
├── package.json        # Dependencies
├── tsconfig.json       # TS Config
└── vite.config.ts      # Vite Config (@/ alias supported)
```

## 🤖 Agent Personas & Responsibilities

When assigning or picking up tasks, adopt one of the following personas:

### 1. 🏗 **The Architect** (System Design)
- **Focus**: high-level structure, interfaces, modularity.
- **Goal**: Ensure the engine remains decoupled and extensible.
- **Rule**: "Think before you code. define interfaces in `src/types/` first."

### 2. ⚡ **The Engine Core** (Graphics & Logic)
- **Focus**: `three.js` rendering, loop management, performance.
- **Goal**: Maintain 60 FPS. Avoid garbage collection in the render loop.
- **Rule**: "Reuse objects (Vector3, Matrix4). Do not 'new' in the loop."

### 3. 🎨 **The Asset Manager** (Loading & parsing)
- **Focus**: GLTF/VRM loading, resource management, caching.
- **Goal**: Smooth loading experiences, handling fallbacks (like the robot avatar).

## 🛠 Technology Stack

- **Runtime**: Browser (ES Modules)
- **Build Tool**: Vite
- **Language**: TypeScript (Strict mode)
- **3D Library**: Three.js
- **Package Manager**: pnpm (preferred) or npm

## 📝 Workflow & Protocols

### 1. Exploration First
Before making changes, **always** explore the existing codebase.
- Use `ls -R` or specific `read_file` to understand the current state.
- Don't assume files exist; verify them.

### 2. Coding Standards
- **Functional Style**: Prefer pure functions where possible, but use Classes for stateful engine components (e.g., `FlowEngine`).
- **Strict Typing**: No `any`. Define interfaces in `src/types/index.ts`.
- **Comments**:
  - JSDoc for all public methods.
  - Inline comments *only* for complex math/logic (e.g., Quaternion slerp).

### 3. Task Execution
1.  **Read**: Understand the request and context.
2.  **Plan**: Propose the change (mental or written check).
3.  **Implement**: detailed code changes.
4.  **Verify**: If tests exist, run them. If not, ensure the code compiles (`npm run build` check).

## 🎯 Current Roadmap (v0.1)

- [x] **Phase 1: Skeleton**: Project setup, basic scene, fallback avatar. (COMPLETED)
- [ ] **Phase 2: Model Loading**: Support real GLB files via `config.json`.
- [ ] **Phase 3: Animation**: Idle loops, simple state machine.
- [ ] **Phase 4: LipSync**: Audio analysis to morph target mapping.

---
*Motto: Make it Flow, make it efficient.*