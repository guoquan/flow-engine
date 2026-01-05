# Skill: Flow Engine Avatar Control

## Overview
This skill provides high-level control over a digital human avatar rendered by the Flow Engine (WebGPU). It allows agents to drive the avatar's speech, thought processes, and physical animations through a unified behavior protocol.

## Capabilities (Skills)

### 1. say
*   **Description**: Makes the avatar speak by displaying a speech bubble and playing the 'talking' animation.
*   **Input Parameters**:
    *   `text`: `string`, The text content to display in the bubble, `required`.
    *   `duration`: `number`, How long the avatar stays in the talking state in milliseconds, `optional`, default: 3000.
*   **Output**:
    *   `status`: `string`, Confirmation of the action.
*   **Example Usage**:
    ```json
    { "action": "say", "params": { "text": "Hello, I am Flow Engine!", "duration": 5000 } }
    ```

### 2. think
*   **Description**: Places the avatar in a 'thinking' state, playing a thinking animation and showing a thought bubble.
*   **Input Parameters**:
    *   `text`: `string`, The content of the thought bubble, `optional`, default: "...".
    *   `duration`: `number`, How long the avatar stays in the thinking state in milliseconds, `optional`, default: 3000.
*   **Output**:
    *   `status`: `string`, Confirmation of the action.
*   **Example Usage**:
    ```json
    { "action": "think", "params": { "text": "Analyzing data...", "duration": 4000 } }
    ```

### 3. play_action
*   **Description**: Triggers a specific pre-defined animation state on the avatar (e.g., waving, bowing).
*   **Input Parameters**:
    *   `action`: `string`, The name of the animation clip to play (e.g., 'wave', 'bow', 'dance'), `required`.
*   **Output**:
    *   `status`: `string`, Confirmation of the action.
*   **Example Usage**:
    ```json
    { "action": "play_action", "params": { "action": "wave" } }
    ```

### 4. set_behavior
*   **Description**: Manually sets the high-level behavior state of the avatar's brain.
*   **Input Parameters**:
    *   `state`: `string`, One of `IDLE`, `TALKING`, `THINKING`, `LISTENING`, `EMOTIONAL`, `required`.
    *   `metadata`: `object`, Additional context like `text`, `emotion`, or `duration`, `optional`.
*   **Output**:
    *   `status`: `string`, Confirmation of state transition.

## Limitations
*   Requires a running WebGPU-capable browser environment for visual output.
*   Animation names depend on the specific `.glb` model and its configuration JSON.
*   Does not support real-time audio lip-sync in the current version (v0.2).

## Dependencies
*   **@guoquan/flow-engine**: v0.2.x, Core rendering and behavior engine.
*   **THREE.js**: r170+, Underlying 3D math and scene graph.

## Maintainers
*   Flow Engine Team - [guoquan.net](https://guoquan.net)
