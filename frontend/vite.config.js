import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import legacy from '@vitejs/plugin-legacy';
export default defineConfig({
  plugins: [react(), legacy({ targets: ['iOS >= 12', 'Safari >= 12', 'Chrome >= 64'], modernPolyfills: true })],
  build: { cssTarget: 'safari12' },
  server: {
    host: '127.0.0.1',
    port: Number(process.env.VITE_DEV_PORT || 5173),
    strictPort: true,
    proxy: {
      '/api': {
        target: process.env.VITE_PROXY_TARGET || 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/media': {
        target: process.env.VITE_PROXY_TARGET || 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/admin/': {
        target: process.env.VITE_PROXY_TARGET || 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/static': {
        target: process.env.VITE_PROXY_TARGET || 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
});
