import { unlinkSync } from 'node:fs';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'drop-frame-layout',
      closeBundle() {
        unlinkSync('dist/assets/oversummoned/frames/layout.json');
      },
    },
  ],
  build: {
    outDir: 'dist',
    assetsDir: 'static',
  },
});
