import { AvatarConfig } from '../types';
import * as THREE from 'three';
/**
 * AvatarLoader
 * 负责加载数字人的配置和模型资源
 */
export declare class AvatarLoader {
    private loader;
    constructor();
    /**
     * 加载数字人
     * @param configUrl 指向 config.json 的 URL
     * @returns Promise<{ model: THREE.Object3D, config: AvatarConfig, animations: THREE.AnimationClip[] }>
     */
    load(configUrl: string): Promise<{
        model: THREE.Object3D;
        config: AvatarConfig;
        animations: THREE.AnimationClip[];
    }>;
    /**
     * 应用配置到模型
     */
    private applyConfig;
    /**
     * 创建一个占位符 Avatar (当模型文件缺失时)
     * 生成一个简单的机器人形状
     */
    private createFallbackAvatar;
}
