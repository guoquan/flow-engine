import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as THREE from 'three';
import { StageLoader } from '../src/core/StageLoader';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Mock GLTFLoader
vi.mock('three/examples/jsm/loaders/GLTFLoader.js', () => {
  const GLTFLoader = vi.fn();
  GLTFLoader.prototype.loadAsync = vi.fn().mockResolvedValue({
    scene: new THREE.Group(),
    animations: []
  });
  return { GLTFLoader };
});

describe('StageLoader', () => {
  let loader: StageLoader;

  beforeEach(() => {
    vi.clearAllMocks();
    
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        modelSrc: 'stage.glb',
        scale: 1.5,
        position: [0, -1, 0]
      })
    });

    loader = new StageLoader();
  });

  it('should load stage from modelSrc if provided', async () => {
    const result = await loader.load('http://example.com/stage/config.json');
    
    expect(result.model).toBeDefined();
    expect(result.config.scale).toBe(1.5);
  });

  it('should create procedural stage if modelSrc is missing', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        scale: 1
      })
    });

    const result = await loader.load('http://example.com/stage/config.json');
    expect(result.model).toBeInstanceOf(THREE.Group);
  });

  it('should throw error if fetch fails', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      statusText: 'Forbidden'
    });

    await expect(loader.load('url')).rejects.toThrow('Failed to load stage config');
  });
});
