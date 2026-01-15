// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ['sicodar.hro.gob.gt'],
    host: true,
    hmr: {
      clientPort: 443,
    },
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});