import { InteractionProcessor, AvatarConfig } from '../types';
import * as THREE from 'three';
export declare class LookAtProcessor implements InteractionProcessor {
    private raycaster;
    private mouse;
    private state;
    private stateTimer;
    private lookAtTarget;
    private currentLookAt;
    private activePlane;
    private planeCenter;
    private lookAtProxy;
    private _targetQuat;
    private _dummyVec;
    private _offsetQuat;
    private _parentWorldQuat;
    private outputQuaternion;
    private weight;
    private container;
    private camera;
    private getHeadBone;
    private getConfig;
    private getModels;
    private boundOnPointerDown;
    private boundOnPointerMove;
    private boundOnPointerUp;
    constructor(container: HTMLElement, camera: THREE.Camera, getHeadBone: () => THREE.Object3D | null, getConfig: () => AvatarConfig | null, getModels: () => THREE.Object3D[]);
    update(timeMs: number, delta: number): void;
    private calculateLookAtRotation;
    private updateState;
    /**
     * Set a manual world-space target for the avatar to look at.
     */
    setTarget(position: THREE.Vector3): void;
    /**
     * Return the LookAt system to IDLE state.
     */
    reset(): void;
    private onPointerDown;
    private onPointerMove;
    private onPointerUp;
    private updateMouse;
    private calculateLookAtTarget;
    getDebugInfo(): {
        isEngaged: boolean;
        currentLookAt: THREE.Vector3;
        activePlane: THREE.Plane;
        planeCenter: THREE.Vector3;
        weight: number;
    };
    interrupt(): void;
    dispose(): void;
}
