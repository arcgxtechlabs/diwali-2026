import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react()],
  base: './',
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  build: {
    target: 'es2022',
    sourcemap: false,
    chunkSizeWarningLimit: 3000,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules/three')) return 'three';
          if (id.includes('node_modules/@react-three') || id.includes('node_modules/postprocessing')) return 'r3f';
          if (id.includes('node_modules/remotion') || id.includes('node_modules/@remotion')) return 'remotion';
          return undefined;
        },
      },
    },
  },
  server: { port: 5173, host: true },
});
