import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

// ✅ [핵심] ES Module 환경에서 __dirname 변수 생성 (이게 없어서 에러가 났던 겁니다)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vitejs.dev/config/
export default defineConfig({
  envPrefix: ['VITE_', 'REACT_APP_'],
  server: {
    port: 5173,
    host: '0.0.0.0',
    strictPort: true,
    allowedHosts: true,
    hmr: {
      overlay: false, // 에러 오버레이 비활성화 (CPU 절약)
    },
    watch: {
      // 대용량 폴더를 감시에서 제외하여 CPU 사용량 감소
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
        '**/test-results/**'
      ],
    },
  },
  base: '/',
  resolve: {
    alias: {
      // 프로젝트 구조가 Root 기반이므로 './' 유지
      '@': path.resolve(__dirname, './'),
    }
  },
  plugins: [
    react(),
  ],
  // ✅ [Security Fix] 프로덕션 빌드에서 console.log/debugger 제거
  // Note: vite build는 항상 production 모드이므로 조건문 불필요
  esbuild: {
    drop: ['debugger'],
    pure: ['console.log', 'console.debug'],
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
          ui: ['lucide-react', 'framer-motion']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
});