# 🗺️ Flow Engine Roadmap

## 🚀 Evolution Path

### Phase 1: Core Interaction (Completed) ✅
- [x] **LookAt Processor V6**: 
    - Damped Pursuit (Slerp) for smooth gaze tracking.
    - "Virtual Target" architecture.
    - Hybrid Raycasting (Physical Objects > Virtual Plane).
    - Billboard-style interaction plane.

### Phase 2: Behavior Engine & Unified API (Next Step) 🏗️
**Goal**: Implement a high-level state machine and standardized interface for avatar control.

- [ ] **Behavior Controller (Global Brain)**:
    - Implement a centralized state machine to manage high-level behaviors.
    - Standard States: `IDLE`, `TALKING`, `THINKING`, `LISTENING`, `EMOTIONAL_EXPRESSION`.
- [ ] **Unified Action API**:
    - **Call/Callback Pattern**: Simple methods to trigger actions (e.g., `engine.say(text)`, `engine.think()`).
    - **Standardized Data Structures**: Define consistent schemas for state exchange and action requests.
- [ ] **Subsystem Refactoring**:
    - Convert `LookAtProcessor` and `AnimationController` into pure "Reflex Organs" managed by the Brain.
    - Priority system to handle conflicting animations vs. interactions.

### Phase 3: Agent Protocols & MCP Integration 🤖
**Goal**: Enable seamless control of avatars by AI agents through industry-standard protocols.

- [ ] **Agent Instruction Mapping**:
    - Allow agents to control the avatar via structured fields in text responses (e.g., `{"action": "wave", "speech": "Hello"}`).
- [ ] **MCP (Model Context Protocol) Implementation**:
    - Build an MCP server wrapper for Flow Engine.
    - Allow agents to "see" the avatar state and "call tools" to move or speak.
- [ ] **Skill Meta-data (`skill.md`)**:
    - Standardize avatar capabilities using the `skill.md` format for better agent discovery and usage.

### Phase 4: Flow Playground 🎡
**Goal**: Transform the default deployment into a versatile playground for developers.

- [ ] **Dynamic Configuration**:
    - UI for users to provide their own GLB model URLs and JSON configurations.
- [ ] **Multi-track Deployment**: 
    - Support accessing different versioned tracks via subdirectories (e.g., `/track/v0.2/`, `/track/v0.3/`) on GitHub Pages.
- [ ] **State Preview**:
    - Visual debugger to see current brain states, weights, and active "reflexes".
- [ ] **API Trigger Console**:
    - Interactive panel to manually trigger API calls/callbacks and preview effects in real-time.

### Future Expansions 🔭
- **Hand/Body IK**: Reusing pursuit logic for reaching and gesturing.
- **Lip Sync**: Audio-driven shape key modulation.
- **Multimodal Feedback**: Visual/Audio cues for agent state awareness.