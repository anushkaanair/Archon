import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    build: {
      outDir: 'dist',
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            motion: ['framer-motion'],
            icons: ['lucide-react'],
          },
        },
      },
    },
    resolve: {
      dedupe: ['react', 'react-dom'],
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'framer-motion'],
    },
    server: {
      port: 5174,
      proxy: {
        '/v1': {
          target: env.VITE_API_URL || 'http://localhost:8000',
          changeOrigin: true,
        },
        '/auth': {
          target: env.VITE_API_URL || 'http://localhost:8000',
          changeOrigin: true,
        },
      },
    },
    define: {
      __API_URL__: JSON.stringify(env.VITE_API_URL || ''),
    },
  };
});
