# 🗺️ Flow Engine Roadmap

## 🚀 Upcoming Features

### Phase 1: Core Interaction (Completed)
- [x] **LookAt Processor V6**: 
    - Implemented Damped Pursuit (Slerp) for smooth gaze tracking.
    - "Virtual Target" architecture to decouple decision from execution.
    - Hybrid Raycasting (Physical Objects > Virtual Plane).
    - Interaction Plane placed 1.5m in front of avatar.

### Phase 2: Architecture Upgrade (Next Step)
**Goal**: Decouple high-level behavior decision-making from low-level reflex subsystems.

#### 1. Global Brain (Hierarchical State Machine)
- **Problem**: `FlowEngine` currently acts as glue code without a clear behavioral model.
- **Solution**: Implement a `BehaviorController` (or `AgentBrain`) that acts as the centralized decision maker.
- **States**:
    - `SLEEPING`: Systems off, weights = 0.
    - `IDLE`: LookAt (Passive), Animation (Idle), Physics (Enabled).
    - `INTERACTING`: LookAt (Active/Hybrid), Animation (Gesture).
    - `PERFORMING`: LookAt (Restricted), Animation (Sequence).

#### 2. Subsystem Delegation
- Refactor `LookAtProcessor`, `AnimationController`, and future `IKController` to be pure **"Reflex Organs"**.
- The Brain sends abstract commands (e.g., `LookAt.setMode('AGGRESSIVE')`, `Arm.reach(target)`) rather than managing frames directly.

#### 3. Priority System
- Implement a weight/priority blending system to handle conflicting requests (e.g., "Death Animation" overrides "Look At Mouse").

### Phase 3: Future Expansions
- **Hand IK**: Reusing the "Damped Pursuit" logic from LookAt V6 for smooth reaching.
- **Lip Sync**: Audio-driven shape key modulation.
