import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react(), wasm(), topLevelAwait()],
  resolve: {
    alias: {
      assert: fileURLToPath(new URL('./src/lib/browser-assert.ts', import.meta.url)),
      'isomorphic-ws': fileURLToPath(new URL('./src/lib/browser-websocket.ts', import.meta.url)),
    },
  },
  assetsInclude: ['**/*.zkir', '**/*.bzkir', '**/*.prover', '**/*.verifier'],
  build: {
    target: 'es2022',
    sourcemap: true,
  },
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.test.ts'],
  },
});
