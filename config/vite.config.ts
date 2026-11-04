import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export const rendererConfig = defineConfig({
  root: fileURLToPath(new URL('..', import.meta.url)),
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    allowedHosts: true,
  },
  preview: { host: '0.0.0.0', allowedHosts: true },
  build: { outDir: 'dist', emptyOutDir: true, target: 'es2022', rollupOptions: { input: fileURLToPath(new URL('../index.html', import.meta.url)) } },
});

export default rendererConfig;
