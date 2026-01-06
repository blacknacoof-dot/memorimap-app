import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  envPrefix: ['VITE_', 'REACT_APP_'],
  server: {
    port: 5173,
    host: '0.0.0.0', // Listen on all IPv4 addresses
    // historyApiFallback: true, // SPA fallback is default in Vite
  },
  base: '/',
  resolve: {
    alias: {
      '@': '/c:/Users/black/Desktop/memorimap', // Absolute path to be safe and avoid missing path module import issues if possible, or just use process.cwd()
    }
  },
  plugins: [
    react(),
    // {
    //   name: 'admin-rewrite',
    //   enforce: 'pre',
    //   configureServer(server) {
    //     server.middlewares.use((req, res, next) => {
    //       if (req.url === '/admin' || req.url === '/admin/') {
    //         req.url = '/admin/index.html';
    //       }
    //       next();
    //     });
    //   }
    // }
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          leaflet: ['leaflet', 'react-leaflet-cluster', 'react-leaflet'],
          ui: ['lucide-react', 'framer-motion']
        }
      }
    },
    chunkSizeWarningLimit: 1000 // Raise limit slightly to avoid noise
  }
});