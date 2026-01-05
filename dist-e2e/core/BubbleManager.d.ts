import * as THREE from 'three';
export declare class BubbleManager {
    private container;
    private bubble;
    private target;
    private camera;
    private visible;
    private offset;
    private _tempVec;
    private lastX;
    private lastY;
    constructor(containerOrId: string | HTMLElement, camera: THREE.Camera);
    setTarget(target: THREE.Object3D): void;
    show(text: string, type?: 'speech' | 'thought'): void;
    hide(): void;
    update(): void;
}
