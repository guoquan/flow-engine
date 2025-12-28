import { defineConfig } from 'vite';
import path from 'path';
import dts from 'vite-plugin-dts'; // We will need this plugin for types

export default defineConfig({
  plugins: [
    // Generate .d.ts files
    dts({ 
      insertTypesEntry: true,
      include: ['src/**/*.ts'],
      exclude: ['src/main.ts', 'src/vite-env.d.ts']
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Base path needed for GitHub Pages (repo name)
  base: process.env.BUILD_DEMO ? '/flow-engine/' : '/',
  // If BUILD_DEMO is true, build as a normal website, otherwise as a library
  build: process.env.BUILD_DEMO ? {
    outDir: 'dist-demo'
  } : {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'Flow',
      fileName: (format) => `flow.${format}.js`
    },
    rollupOptions: {
      // Externalize deps that shouldn't be bundled
      external: ['three', 'three/webgpu', 'three/examples/jsm/controls/OrbitControls.js', 'three/examples/jsm/loaders/GLTFLoader.js'],
      output: {
        // Global variables to use in the UMD build
        globals: {
          'three': 'THREE',
          'three/webgpu': 'THREE', 
        }
      }
    }
  },
  server: {
    host: true,
    port: 5173,
  }
});