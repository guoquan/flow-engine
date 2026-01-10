import { AnimationStateConfig } from '../types';
import * as THREE from 'three';
export declare class AnimationController {
    private mixer;
    private clips;
    private states;
    private activeActions;
    private currentState;
    private defaultState;
    constructor(model: THREE.Object3D, animations: THREE.AnimationClip[]);
    /**
     * Initialize with configuration
     */
    init(config: {
        defaultState: string;
        states: Record<string, AnimationStateConfig>;
    }): void;
    /**
     * Update mixer (call this every frame)
     */
    update(delta: number): void;
    /**
     * Play a state
     */
    play(stateName: string, forceReset?: boolean): void;
    private onFinished;
    /**
     * Finds an animation clip by name using exact, case-insensitive, or fuzzy matching.
     */
    private findClip;
}
