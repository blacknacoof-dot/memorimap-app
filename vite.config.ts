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
  ]
});