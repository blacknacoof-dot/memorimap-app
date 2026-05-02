import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.atomcare.memorimap',
  appName: 'Memorimap',
  webDir: 'dist',
  server: {
    hostname: 'memorimap.kr',
    androidScheme: 'https',
  },
};

export default config;
