import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';
import { codecovVitePlugin } from '@codecov/vite-plugin';

export default defineConfig({
  // Only use /flow-engine/ base path when building the demo for GitHub Pages
  base: process.env.BUILD_DEMO ? '/flow-engine/' : '/',
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'Flow',
      fileName: (format) => `flow.${format}.js`
    },
    rollupOptions: {
      external: ['three', 'three/examples/jsm/loaders/GLTFLoader.js', 'three/webgpu'],
      output: {
        globals: {
          three: 'THREE',
          'three/webgpu': 'THREE'
        }
      }
    },
    outDir: process.env.OUT_DIR || 'dist'
  },
  plugins: [
    dts({
      include: ['src/**/*.ts']
    }),
    codecovVitePlugin({
      enableBundleAnalysis: process.env.CODECOV_TOKEN !== undefined,
      bundleName: `flow-engine-${process.env.VITE_BUILD_TARGET || 'library'}`,
      uploadToken: process.env.CODECOV_TOKEN
    })
  ],
  // @ts-ignore - vitest config
  test: {
    environment: 'jsdom',
    globals: true,
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache', 'tests/e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['src/core/**/*.ts'],
      exclude: ['src/main.ts', 'src/index.ts', 'src/types/**']
    }
  }
});