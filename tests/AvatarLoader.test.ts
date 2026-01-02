import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as THREE from 'three';
import { AvatarLoader } from '../src/core/AvatarLoader';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Mock GLTFLoader
vi.mock('three/examples/jsm/loaders/GLTFLoader.js', () => {
  const GLTFLoader = vi.fn();
  GLTFLoader.prototype.loadAsync = vi.fn().mockResolvedValue({
    scene: new THREE.Group(),
    animations: [new THREE.AnimationClip('idle', 1, [])]
  });
  return { GLTFLoader };
});

describe('AvatarLoader', () => {
  let loader: AvatarLoader;

  beforeEach(() => {
    vi.clearAllMocks();
    
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        modelSrc: 'model.glb',
        scale: 2,
        initialPosition: [0, 1, 0]
      })
    });

    loader = new AvatarLoader();
  });

  it('should load avatar config and model successfully', async () => {
    const result = await loader.load('http://example.com/avatar/config.json');
    
    expect(result.model).toBeDefined();
    expect(result.config.scale).toBe(2);
    expect(result.animations.length).toBe(1);
  });

  it('should throw error if config fetch fails', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      statusText: 'Not Found'
    });

    await expect(loader.load('invalid-url')).rejects.toThrow('Failed to load config');
  });

  it('should use fallback avatar if model loading fails', async () => {
    vi.spyOn(GLTFLoader.prototype, 'loadAsync').mockRejectedValue(new Error('Load Error'));
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    const result = await loader.load('http://example.com/avatar/config.json');
    
    expect(result.model).toBeDefined();
    expect(result.model.children.length).toBeGreaterThan(0);
    expect(consoleSpy).toHaveBeenCalled();
    
    consoleSpy.mockRestore();
  });
});
