import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { AvatarConfig } from '../types';

/**
 * AvatarLoader
 * 负责加载数字人的配置和模型资源
 */
export class AvatarLoader {
  private loader: GLTFLoader;

  constructor() {
    this.loader = new GLTFLoader();
  }

  /**
   * 加载数字人
   * @param configUrl 指向 config.json 的 URL
   * @returns Promise<{ model: THREE.Object3D, config: AvatarConfig }>
   */
  async load(configUrl: string): Promise<{ model: THREE.Object3D; config: AvatarConfig }> {
    console.log(`[Flow] Loading avatar config from: ${configUrl}`);

    try {
      // 1. Fetch Config
      const response = await fetch(configUrl);
      if (!response.ok) {
        throw new Error(`Failed to load config: ${response.statusText}`);
      }
      const config: AvatarConfig = await response.json();
      
      // Resolve model path relative to config file
      const basePath = configUrl.substring(0, configUrl.lastIndexOf('/') + 1);
      const modelUrl = basePath + config.modelSrc;

      console.log(`[Flow] Config loaded. Loading model from: ${modelUrl}`);

      // 2. Load Model (with Fallback)
      let model: THREE.Object3D;
      try {
        const gltf = await this.loader.loadAsync(modelUrl);
        model = gltf.scene;
      } catch (error) {
        console.warn(`[Flow] Failed to load 3D model at ${modelUrl}. Using fallback placeholder.`, error);
        model = this.createFallbackAvatar();
      }

      // 3. Apply Config
      this.applyConfig(model, config);

      return { model, config };
    } catch (error) {
      console.error('[Flow] Error loading avatar:', error);
      throw error;
    }
  }

  /**
   * 应用配置到模型
   */
  private applyConfig(model: THREE.Object3D, config: AvatarConfig) {
    if (config.scale) {
      model.scale.setScalar(config.scale);
    }
    if (config.initialPosition) {
      model.position.set(...config.initialPosition);
    }
    // Enable shadows
    model.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }

  /**
   * 创建一个占位符 Avatar (当模型文件缺失时)
   * 生成一个简单的机器人形状
   */
  private createFallbackAvatar(): THREE.Group {
    const group = new THREE.Group();

    // Material
    const material = new THREE.MeshStandardMaterial({ 
      color: 0x00d2ff, 
      roughness: 0.3,
      metalness: 0.8 
    });

    // Head
    const headGeo = new THREE.BoxGeometry(0.8, 0.9, 0.8);
    const head = new THREE.Mesh(headGeo, material);
    head.position.y = 1.5;
    head.name = 'Head';
    group.add(head);

    // Eyes (Glowing)
    const eyeGeo = new THREE.SphereGeometry(0.1);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.2, 1.5, 0.4);
    group.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.2, 1.5, 0.4);
    group.add(rightEye);

    // Body
    const bodyGeo = new THREE.CylinderGeometry(0.6, 0.4, 1.5, 8);
    const body = new THREE.Mesh(bodyGeo, material);
    body.position.y = 0.5;
    body.name = 'Body';
    group.add(body);

    // Arms
    const armGeo = new THREE.CapsuleGeometry(0.15, 1);
    
    const leftArm = new THREE.Mesh(armGeo, material);
    leftArm.position.set(-0.9, 0.8, 0);
    leftArm.rotation.z = Math.PI / 4;
    leftArm.name = 'LeftArm';
    group.add(leftArm);

    const rightArm = new THREE.Mesh(armGeo, material);
    rightArm.position.set(0.9, 0.8, 0);
    rightArm.rotation.z = -Math.PI / 4;
    rightArm.name = 'RightArm';
    group.add(rightArm);

    return group;
  }
}