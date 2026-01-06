import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';
import { codecovVitePlugin } from '@codecov/vite-plugin';

export default defineConfig({
  // Use /flow-engine/ if GITHUB_PAGES or BUILD_DEMO is true, otherwise root /
  base: (process.env.GITHUB_PAGES === 'true') ? '/flow-engine/' : '/',
  
  build: (process.env.BUILD_DEMO === 'true') 
    ? {
        // App mode build
        outDir: process.env.OUT_DIR || 'dist-demo'
      }
    : {
        // Library mode build
        lib: {
          entry: resolve(__dirname, 'src/index.ts'),
          name: 'Flow',
          fileName: (format) => `flow.${format}.js`
        },
        rollupOptions: {
          external: [
            'three', 
            'three/examples/jsm/loaders/GLTFLoader.js', 
            'three/webgpu',
            'ws',
            '@modelcontextprotocol/sdk',
            'zod-to-json-schema'
          ],
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
    reporters: ['default', 'junit'],
    outputFile: {
      junit: './test-results/junit.xml'
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['src/core/**/*.ts'],
      exclude: ['src/main.ts', 'src/index.ts', 'src/types/**']
    }
  }
});
