import * as THREE from 'three';
export declare class BubbleManager {
    private scene;
    private sprite;
    private target;
    private offset;
    private visible;
    private canvas;
    private ctx;
    private texture;
    constructor(scene: THREE.Scene);
    setTarget(target: THREE.Object3D): void;
    show(text: string, type?: 'speech' | 'thought'): void;
    hide(): void;
    update(): void;
    private drawBubble;
    private drawRoundedRect;
    private drawCloud;
}
