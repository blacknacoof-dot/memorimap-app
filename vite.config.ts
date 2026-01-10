import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  envPrefix: ['VITE_', 'REACT_APP_'],
  server: {
    port: 5173,
    host: '0.0.0.0',
    // historyApiFallback: true, // SPA fallback is default in Vite
  },
  base: '/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'), // Point to root since there is no src folder
    }
  },
  plugins: [
    react(),

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
    chunkSizeWarningLimit: 1000
  }
});