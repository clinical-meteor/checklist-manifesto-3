import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/checklist-manifesto-3/', // This should match your GitHub repository name
  build: {
    outDir: 'docs',
    emptyOutDir: true,
  },
  publicDir: 'public',
});