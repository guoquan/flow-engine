# 🗺️ Flow Engine Roadmap

## 🚀 Evolution Path

### Phase 1: Core Interaction (Completed) ✅
- [x] **LookAt Processor V6**: 
    - Damped Pursuit (Slerp) for smooth gaze tracking.
    - "Virtual Target" architecture.
    - Hybrid Raycasting (Physical Objects > Virtual Plane).
    - Billboard-style interaction plane.

### Phase 2: Behavior Engine & Unified API (Completed) ✅
**Goal**: Implement a high-level state machine and standardized interface for avatar control.

- [x] **Behavior Controller (Global Brain)**:
    - Implement a centralized state machine to manage high-level behaviors.
    - Standard States: `IDLE`, `TALKING`, `THINKING`, `LISTENING`, `EMOTIONAL_EXPRESSION`.
- [x] **Unified Action API**:
    - **Call/Callback Pattern**: Simple methods to trigger actions (e.g., `engine.say(text)`, `engine.think()`).
    - **Standardized Data Structures**: Define consistent schemas for state exchange and action requests.
- [x] **Subsystem Refactoring**:
    - Convert `LookAtProcessor` and `AnimationController` into pure "Reflex Organs" managed by the Brain.
    - Priority system to handle conflicting animations vs. interactions.

### Phase 3: Agent Protocols & MCP Integration (Completed) ✅
**Goal**: Enable seamless control of avatars by AI agents through industry-standard protocols.

- [x] **Agent Instruction Mapping**:
    - Allow agents to control the avatar via structured fields in text responses (e.g., `{"action": "wave", "speech": "Hello"}`).
- [x] **MCP (Model Context Protocol) Implementation**:
    - Build an MCP server wrapper for Flow Engine.
    - Allow agents to "see" the avatar state and "call tools" to move or speak.
- [x] **Skill metadata (`skill.md`)**:
    - Standardize avatar capabilities using the `skill.md` format for better agent discovery and usage.
- [x] **Schema-First Architecture**:
    - Unified Zod schemas for internal API and MCP tools to ensure 100% consistency.
- [x] **Visual API Documentation (TypeDoc)**:
    - Standard TypeScript SDK documentation generated from source code.

### Phase 4: Flow Playground (Completed) ✅
**Goal**: Transform the default deployment into a versatile playground for developers.

- [x] **Interactive Control Panel**:
    - **Action Buttons**: Quick triggers for `wave`, `bow`, `say`, `think`.
    - **State Monitor**: Real-time display of Brain states (`IDLE`, `TALKING`, etc.).
    - **JSON Console**: Manual input for `AgentResponse` payloads.
- [x] **Dynamic Asset Loading**:
    - UI inputs to load custom `.glb` models and `config.json` files from URLs.
- [x] **MCP Bridge (WebSocket)**:
    - Connect the browser playground to the local MCP server to receive commands in real-time.
- [x] **Multi-track Deployment**: 
    - Support accessing different versioned tracks via subdirectories on GitHub Pages.
- [x] **E2E Systematic Parity**:
    - Complete E2E coverage for UI and MCP actions with visual reporting.

### Phase 5: Advanced Animation & IK (v0.3 - Planned) 🔜
**Goal**: Introduce procedural realism through Inverse Kinematics and blending.

- [ ] **Reflexive IK**: Automatic head/neck/spine tracking based on attention targets (replacing simple LookAt).
- [ ] **Hand IK**: Reaching and gesturing capabilities.
- [ ] **Animation Blending**: Smooth transitions between reflexive looking and canned actions.
- [ ] **Spine Twist**: More natural body rotation logic.

### Future Expansions (v0.4+) 🔭
- **Lip Sync**: Audio-driven shape key modulation.
- **Multimodal Feedback**: Visual/Audio cues for agent state awareness.