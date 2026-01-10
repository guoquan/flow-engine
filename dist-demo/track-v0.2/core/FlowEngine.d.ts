import { BehaviorIntent, AgentResponse } from '../types';
import { SayParams, ThinkParams } from '../schemas/actions';
export declare class FlowEngine {
    private container;
    private scene;
    private camera;
    private renderer;
    private controls;
    private clock;
    private loader;
    private stageLoader;
    private avatarModel;
    private stageModel;
    private headBone;
    private animController;
    private stageAnimController;
    private lookAtProcessor;
    private brain;
    private bubbleManager;
    private currentAvatarConfig;
    isDebug: boolean;
    private debugTargetMesh;
    private debugPlaneMesh;
    constructor(containerId: string);
    private setupLights;
    /**
     * Load an avatar by config URL
     */
    loadAvatar(configUrl: string): Promise<void>;
    /**
     * Load a stage (podium/scene) by config URL
     */
    loadStage(configUrl: string): Promise<void>;
    setDebug(enabled: boolean): void;
    private createDebugHelpers;
    private updateDebugHelpers;
    private removeDebugHelpers;
    private onWindowResize;
    isAutoRotate: boolean;
    /**
     * HIGH-LEVEL BEHAVIOR API
     */
    /**
     * Submit a 'TALKING' intent to the brain.
     * @param params Conversation parameters (text, duration)
     */
    say(params: SayParams | string): void;
    /**
     * Submit a 'THINKING' intent to the brain.
     * @param params Thought parameters (text, duration)
     */
    think(params?: ThinkParams | string): void;
    /**
     * Submit a complex behavior intent.
     * @param intent The behavior intent object
     */
    setBehavior(intent: BehaviorIntent): void;
    /**
     * Processes a structured response from an AI Agent.
     * This is the primary bridge for Agent-to-Avatar interaction.
     * @param response The structured message according to the Unified Action Protocol
     */
    processAgentResponse(response: AgentResponse): void;
    /**
     * Internal executor for discrete action commands.
     * Note: Actions scheduled with delay may conflict if state changes rapidly.
     */
    private executeCommand;
    /**
     * Play a manual low-level action. Interrupts high-level brain state.
     * @param action State name defined in config.animations.states
     */
    playAction(action: string): void;
    private animate;
}
