import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { StageConfig, AnimationStateConfig } from '../types';

export class StageLoader {
  private loader: GLTFLoader;

  constructor() {
    this.loader = new GLTFLoader();
  }

  async load(configUrl: string): Promise<{ model: THREE.Object3D; config: StageConfig; animations: THREE.AnimationClip[] }> {
    try {
      const response = await fetch(configUrl);
      if (!response.ok) throw new Error(`Failed to load stage config`);
      const config: StageConfig = await response.json();

      let model: THREE.Object3D;
      let animations: THREE.AnimationClip[] = [];

      if (config.modelSrc) {
        const basePath = configUrl.substring(0, configUrl.lastIndexOf('/') + 1);
        const modelUrl = basePath + config.modelSrc;
        const gltf = await this.loader.loadAsync(modelUrl);
        model = gltf.scene;
        animations = gltf.animations || [];
      } else {
        model = this.createProceduralStage();
      }

      this.applyConfig(model, config);
      return { model, config, animations };
    } catch (error) {
      console.error('[Flow] Stage load error:', error);
      throw error;
    }
  }

  private applyConfig(model: THREE.Object3D, config: StageConfig) {
    if (config.scale) model.scale.setScalar(config.scale);
    if (config.position) model.position.set(...config.position);
    if (config.rotation) model.rotation.set(...config.rotation);
    
    model.traverse(c => {
      if ((c as THREE.Mesh).isMesh) {
        c.receiveShadow = true;
        c.castShadow = true;
      }
    });
  }

  /**
   * Generates a cool Sci-Fi Podium if no model is provided
   */
  private createProceduralStage(): THREE.Group {
    const group = new THREE.Group();

    // 1. Base Platform (Cylinder)
    const baseGeo = new THREE.CylinderGeometry(2, 2.2, 0.2, 32);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.2, metalness: 0.8 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = -0.1;
    group.add(base);

    // 2. Glowing Ring
    const ringGeo = new THREE.TorusGeometry(1.8, 0.05, 16, 100);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x00d2ff });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.01;
    group.add(ring);

    // 3. Floating Platforms (for style)
    const platGeo = new THREE.BoxGeometry(0.5, 0.05, 0.5);
    for (let i = 0; i < 4; i++) {
      const mesh = new THREE.Mesh(platGeo, baseMat);
      const angle = (i / 4) * Math.PI * 2;
      mesh.position.set(Math.cos(angle) * 2.5, 0, Math.sin(angle) * 2.5);
      mesh.lookAt(0, 0, 0);
      group.add(mesh);
    }

    return group;
  }
}
