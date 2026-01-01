# Flow (服喽) Engine (`@guoquan.net/flow-engine`) - AI Agent Collaboration Protocol

Welcome to the **Flow Engine** development environment.

## 📂 Project Structure

```
.
├── AGENTS.md           # This file (AI Protocol)
├── README.md           # Project Entry
├── ROADMAP.md          # Architecture Roadmap
├── .github/
│   └── workflows/      # CI/CD Pipelines
├── tests/
│   ├── unit/           # Vitest Unit Tests
│   └── e2e/            # Playwright E2E Tests
└── src/                # Source Code
```

## 🏗 Architecture Principles (v0.2 - WebGPU)

1.  **WebGPU First**: The engine uses `WebGPURenderer`.
2.  **Data Driven (FSM)**: Animation logic is handled by a Finite State Machine.
3.  **Controller-Agent Pattern**: Decoupled `FlowEngine` (Scene) and `LookAtProcessor` (Logic).

## 📝 Workflow & Protocols

### 1. The Pull Request Lifecycle (STRICT)

Agents must strictly follow this lifecycle for every change:

1.  **Draft Creation**:
    *   ALWAYS create PRs as drafts first: `gh pr create --draft`.
    *   Do not request review immediately.

2.  **Self-Verification Loop**:
    *   **Wait** for CI checks (Unit Tests, Build, Lint).
    *   **Check** coverage reports. Codecov must remain green.
    *   **Fix** any failures autonomously *before* marking ready.

3.  **Ready for Review**:
    *   Once CI is green, promote the PR: `gh pr ready`.
    *   This signals humans and Copilot to review.

4.  **Review & Iteration**:
    *   **Wait** for Copilot/Human reviews.
    *   **Analyze** feedback thoroughly.
    *   **Resolve** every comment explicitly via code changes.
    *   Repeat the verification loop if changes break tests.

5.  **Merge**:
    *   Only merge when: CI is Green AND Reviews are Approved.
    *   Use `Squash and merge`.

### 2. Testing Standards

*   **Unit Tests (`vitest`)**:
    *   Must cover >90% of business logic.
    *   Must mock external dependencies (Three.js, WebGPU).
*   **E2E Tests (`playwright`)**:
    *   **Visual Proof**: Every UI/Interaction PR must trigger E2E tests.
    *   **Screenshots**: Tests must generate screenshots for key states (Idle, Interaction, etc.).
    *   **Reporting**: 
        - Small thumbnails (<100KB) -> Embed as Base64 in PR comments.
        - Full-size images -> Push to `visual-reports` branch (orphan branch).

## 🛠 Engineering Guidelines

- **Strict Typing**: No `any`. Use `import type` for interfaces.
- **Cross-Fade**: Always use `fadeIn/fadeOut` for transitions.
- **No Translation**: Keep existing comments in their original language unless asked otherwise.