import { StageConfig } from '../types';
import * as THREE from 'three';
export declare class StageLoader {
    private loader;
    constructor();
    load(configUrl: string): Promise<{
        model: THREE.Object3D;
        config: StageConfig;
        animations: THREE.AnimationClip[];
    }>;
    private applyConfig;
    /**
     * Generates a cool Sci-Fi Podium if no model is provided
     */
    private createProceduralStage;
}
