import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/checklist-manifesto/', // This should match your GitHub repository name
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  publicDir: 'public',
});