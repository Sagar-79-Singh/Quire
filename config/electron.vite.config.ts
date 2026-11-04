import { fileURLToPath } from 'node:url';
import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import { rendererConfig } from './vite.config';

const root = fileURLToPath(new URL('..', import.meta.url));

export default defineConfig({
  main: {
    root,
    plugins: [externalizeDepsPlugin()],
    build: {
      outDir: 'dist-electron/main',
      rollupOptions: { input: `${root}/electron/index.ts`, output: { entryFileNames: 'index.js' } },
    },
  },
  preload: {
    root,
    plugins: [externalizeDepsPlugin()],
    build: {
      outDir: 'dist-electron/preload',
      rollupOptions: {
        input: `${root}/electron/preload-entry.ts`,
        output: { format: 'cjs', entryFileNames: 'index.cjs' },
      },
    },
  },
  renderer: { ...rendererConfig, base: './' },
});
