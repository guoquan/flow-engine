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
*   **Merge Target**: `main`.

### 2. Evolution Tracks (`track/v0.2`, `track/v0.3`, etc.)
*   **Status**: Active Incubation / Next-Gen.
*   **Naming Pattern**: Must use the **`track/`** prefix (e.g., `track/v0.2`).
*   **Conflict Avoidance**: This prefix avoids wildcard collisions with system branches like `visual-reports`.
*   **Workflow**: Feature branches for the next generation are branched from and PR'd back into the corresponding track.

### 3. Transient Workflows
*   **Isolation**: All work must occur in `<type>/<description>` branches.
*   **Targeting**: agents **MUST** identify the correct target track before branching.

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

#### Phase 3: Delivery & Review Cycle (Strict) 🚚

The Agent **MUST** follow this cycle for every PR. **ABSOLUTELY NO SELF-MERGING.**

1.  **Draft Submission**:
    *   **Push**: `git push origin <branch-name>`.
    *   **Create PR**: `gh pr create --draft`.

2.  **CI Verification (Draft)**:
    *   **Monitor**: Track all checks in real-time.
        *   `gh run watch` (for Actions)
        *   `gh pr checks --watch` (for all checks including external ones)
    *   **Fix**: If CI fails, push fixes immediately.
    *   **Goal**: The PR **MUST** be Green ✅ (CI Passed) before leaving Draft.

3.  **Request Review**:
    *   **Promote**: Once CI is Green, run `gh pr ready <pr-number>`.
    *   **Wait**: Do **NOT** proceed. Wait for automated reviews (Copilot) or human feedback.

4.  **Review Loop (Iterative)**:
    *   **Check**: The Agent **MUST** periodically poll for new comments (`gh pr view --comments`) at reasonable intervals (e.g., every 30-60 seconds) while waiting. Do not assume silence means approval. Respect GitHub API rate limits.
        *   *Example Command*: `sleep 30 && gh pr view <pr-number> --comments`
    *   **Address**: If feedback requires changes:
        *   Convert back to Draft if changes are major (`gh pr ready --undo` or use GitHub UI).
        *   Implement fixes.
        *   Verify CI again (Must be Green).
        *   Reply to comments if necessary.
    *   **Repeat**: Go back to Step 3 until all feedback is resolved.

5.  **Handover (Stop)**:
    *   **Condition**: PR is Green ✅ AND All Reviews Addressed/Approved.
    *   **Action**: Stop. Do **NOT** merge.
    *   **Notify**: Display a banner or message to the user:
        > "PR #XX is Ready for Merge. All checks passed. Awaiting your command."

**🛑 CRITICAL RULE: The Agent MUST NEVER use `gh pr merge` or merge locally to the target branch unless explicitly commanded by the user *after* the PR is ready.**

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