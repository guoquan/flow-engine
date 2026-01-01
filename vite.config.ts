import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';
import { codecovVitePlugin } from '@codecov/vite-plugin';

export default defineConfig({
  // Use /flow-engine/ if GITHUB_PAGES or BUILD_DEMO is true
  base: (process.env.GITHUB_PAGES || process.env.BUILD_DEMO) ? '/flow-engine/' : '/',
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
  ]
});
