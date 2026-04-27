import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  envPrefix: ['VITE_', 'REACT_APP_'],
  server: {
    port: 5173,
    host: 'localhost',
    strictPort: true,
    hmr: {
      overlay: false,
    },
    watch: {
      ignored: [
        '**/backups/**',
        '**/scripts/**',
        '**/data/**',
        '**/node_modules/**',
        '**/tools/**',
        '**/.git/**',
        '**/dist/**',
        '**/.venv/**',
        '**/supabase/**',
        '**/cypress/**',
        '**/playwright-report/**',
        '**/test-results/**',
      ],
    },
  },
  base: '/',
  resolve: {
    alias: {
      // Avoid the supabase-js wrapper entry that triggers Rollup default-export warnings on Vite 7.
      '@supabase/supabase-js': path.resolve(__dirname, './node_modules/@supabase/supabase-js/dist/module/index.js'),
      '@': path.resolve(__dirname, './'),
    },
  },
  plugins: [
    react(),
  ],
  esbuild: {
    drop: ['debugger'],
    pure: ['console.log', 'console.debug', 'console.warn', 'console.error', 'console.info'],
  },
  optimizeDeps: {
    force: false,
    esbuildOptions: {
      target: 'es2020',
    },
  },
  build: {
    sourcemap: false,
    reportCompressedSize: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['lucide-react', 'framer-motion'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
});
