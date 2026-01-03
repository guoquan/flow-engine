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

We use a **Versioned Track** model to support long-term incubation of major upgrades without compromising the stability of the current release.

### 1. Primary Track (`main`)
*   **Status**: Stable / Production.
*   **Scope**: v0.1.x series.
*   **Maintenance**: Only accepts critical bug fixes and documentation refinements.
*   **Merge Target**: `main`.

### 2. Evolution Tracks (`v0.2`, `v0.3`, etc.)
*   **Status**: Active Incubation / Next-Gen.
*   **Purpose**: These are **full-tier** primary branches for major architectural shifts (Phase 2-4 of Roadmap).
*   **Workflow**: Feature branches for the next generation are branched from and PR'd back into the corresponding version track (e.g., `feat/behavior-engine` -> `v0.2`).
*   **Promotion**: Once a track (e.g., `v0.2`) is deemed mature and ready for general availability, it will be merged into `main` via a **Grand Release PR**, effectively upgrading the project's stable baseline.

### 3. Transient Workflows
*   **Isolation**: All work must occur in `<type>/<description>` branches.
*   **Context Awareness**: Agents **MUST** identify which track they are targeting before branching.
    *   If fixing v0.1: Target `main`.
    *   If building v0.2: Target `v0.2`.

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
            - **Branch Policy**: The `visual-reports` branch **MUST NOT** be protected by strict PR rules. It must allow direct pushes from `github-actions[bot]` to function correctly.
            - PR comments -> Link to the relevant images in `visual-reports` for quick visual review.
## 🛠 Engineering Guidelines

- **Strict Typing**: No `any`. Use `import type` for interfaces.
- **Cross-Fade**: Always use `fadeIn/fadeOut` for transitions.
- **No Translation**: Keep existing comments in their original language unless asked otherwise.