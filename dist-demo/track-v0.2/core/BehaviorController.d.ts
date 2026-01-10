import { AvatarBehaviorState, BehaviorIntent } from '../types';
/**
 * BehaviorController (The Global Brain)
 * Manages the high-level behavioral state machine of the avatar.
 */
export declare class BehaviorController {
    private currentState;
    private stateStartTime;
    private stateTimeout;
    private isTransitioning;
    private debug;
    /**
     * Optional callback triggered when the behavioral state changes.
     */
    onStateChange?: (newState: AvatarBehaviorState, intent: BehaviorIntent) => void;
    /**
     * @param options.debug Enable verbose logging for transitions
     */
    constructor(options?: {
        debug?: boolean;
    });
    /**
     * Toggles debug logging mode without re-initializing the controller.
     */
    setDebugMode(enabled: boolean): void;
    /**
     * @returns Whether debug mode is currently enabled.
     */
    isDebugEnabled(): boolean;
    /**
     * Drives the brain logic.
     * @param timeMs Consistent external timestamp (usually from requestAnimationFrame).
     */
    update(timeMs: number): void;
    /**
     * Core API: Submit a behavioral intent to the brain.
     * @param intent The desired behavior change
     * @param timeMs Optional current time (defaults to performance.now())
     */
    setIntent(intent: BehaviorIntent, timeMs?: number): void;
    /**
     * @returns The current high-level behavior state.
     */
    getState(): AvatarBehaviorState;
}
