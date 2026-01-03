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

## 🌿 Branching Strategy

We operate on a **Dual-Track** model to balance v0.1 stability with v0.2 innovation.

### 1. Permanent Tracks
*   **`main` (Stable/v0.1.x)**:
    *   **Purpose**: Current production-ready code.
    *   **Accepted Changes**: Critical bug fixes, security patches, and minor documentation refinements.
    *   **Release**: Tagging `main` triggers stable releases.
*   **`v0.2-dev` (Incubation/Next-Gen)**:
    *   **Purpose**: Prototyping and implementing Phase 2-4 of the Roadmap.
    *   **Accepted Changes**: All architectural refactoring, Behavior Engine, MCP integration, and Playground features.
    *   **Status**: Protected. All updates must arrive via PR.

### 2. Transient Workflows
*   **Feature/Fix Isolation**: 
    *   If targeting v0.1: Branch off `main` -> PR to `main`.
    *   If targeting v0.2: Branch off `v0.2-dev` -> PR to `v0.2-dev`.
*   **Naming Convention**: `<type>/<description>` (e.g., `feat/behavior-brain`, `fix/memory-leak`).

### 3. Sync & Promotion
*   **Merging Down**: Periodic merges from `main` to `v0.2-dev` are required to ensure the incubation branch benefits from v0.1 stability fixes.
*   **Promotion**: When the Behavior Engine and Playground are mature, `v0.2-dev` will be merged into `main` via a formal **Major Release PR (v0.2.0)**.

## 📝 Workflow & Protocols

### 1. Agent Operating Procedure (Strict)

For **every** update requirement, the Agent **must** autonomously drive the following lifecycle. Do not wait for the user to request these steps.

#### Phase 1: Isolation 🛡️
*   **Identify Scope**: Determine if it's a `fix/`, `feat/`, or `chore/`.
*   **Branch Immediately**: **NEVER** commit directly to `main`.
    *   Command: `git checkout -b <type>/<descriptive-name>`
*   **Sync First**: Ensure you branch off the latest `main`.

#### Phase 2: Implementation & Verification 🧪
*   **Commit**: Use **Conventional Commits** (e.g., `fix(core): ...`, `feat(api): ...`).
*   **GPG Signing**: Use `--no-gpg-sign` for automated commits to avoid interactive agent prompts (e.g., 1Password). Humans will handle signing manually if needed.
*   **Test**: Run `npm test`.

#### Phase 3: Delivery & Review 🚚

1.  **Delivery**:
    *   **Push**: `git push origin <branch-name>`.
    *   **Draft PR**: `gh pr create --draft`.

2.  **Verification**:
    *   **Monitor (MANDATORY)**: You **MUST** track CI progress in real-time. Use:
        *   `gh pr checks --watch`
        *   OR `gh run watch`
    *   The PR **MUST** be Green ✅ before any further action.
    *   **Promote**: `gh pr ready`.

3.  **Review & Iteration**:
    *   **Respond**: Resolve all comments. Re-verify via `gh pr checks --watch`.

4.  **Merge**:
    *   **Criteria**: CI Green ✅ AND Reviews Approved ✅.
    *   **Strategy**: Use **Squash and merge**.

### 2. Release & Versioning Standards

*   **Semantic Versioning**: Adhere strictly to SemVer (Major.Minor.Patch).
*   **Release Automation**: Pushing a tag (e.g., `v0.1.9`) triggers NPM/GPR publication.
*   **GitHub Releases**: Every tag **must** have a corresponding GitHub Release with a clean summary (avoiding PR technical jargon). Use `gh release create`.

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