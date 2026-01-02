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

### 1. Agent Operating Procedure (Strict)

For **every** update requirement, the Agent **must** autonomously drive the following lifecycle. Do not wait for the user to request these steps.

#### Phase 1: Isolation 🛡️
*   **Identify Scope**: Determine if it's a `fix/`, `feat/`, or `chore/`.
*   **Branch Immediately**: **NEVER** commit directly to `main`.
    *   Command: `git checkout -b <type>/<descriptive-name>`
*   **Sync First**: Ensure you branch off the latest `main`.

#### Phase 2: Implementation & Verification 🧪
*   **Code**: Apply changes adhering to engineering guidelines.
*   **Test**: Run `npm test` (Unit) and `npm run test:e2e` (Visual) if applicable.
*   **Commit**: Use conventional commits (e.g., `fix(core): ...`).

#### Phase 3: Delivery & Review 🚚
*   **Push**: `git push origin <branch-name>`.
*   **Draft PR**: Create a draft to trigger CI without notifying reviewers.
    *   Command: `gh pr create --draft`
*   **CI Verification**: Monitor the PR checks. **Must** be green before proceeding.
    *   Command: `gh pr checks`
*   **Promote**: Mark the PR as ready for review.
    *   Command: `gh pr ready`

#### Phase 4: Follow-through 🔄
*   **Monitor**: Check for merge status (via `git branch --merged` or user confirmation).
*   **Cleanup**: Once merged, proactively delete the local feature branch to keep the workspace clean.
    *   Command: `git branch -d <branch-name>`
*   **Resync**: Switch back to `main` and pull latest.

### 2. Testing Standards

*   **Unit Tests (`vitest`)**:
    *   Must cover >90% of business logic.
    *   Must mock external dependencies (Three.js, WebGPU).
*   **E2E Tests (`playwright`)**:
    *   **Visual Proof**: Every UI/Interaction PR must trigger E2E tests.
    *   **Screenshots**: Tests must generate screenshots for key states (Idle, Interaction, etc.).
    *   **Reporting**: 
        - Screenshots -> Push full-size images to the `visual-reports` orphan branch.
        - PR comments -> Link to the relevant images in `visual-reports` for quick visual review.

## 🛠 Engineering Guidelines

- **Strict Typing**: No `any`. Use `import type` for interfaces.
- **Cross-Fade**: Always use `fadeIn/fadeOut` for transitions.
- **No Translation**: Keep existing comments in their original language unless asked otherwise.