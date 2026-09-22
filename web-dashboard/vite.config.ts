```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/wasteflow/',

  plugins: [react()],

  server: {
    port: 5173,
    proxy: {
      // Convenience during development: /api -> backend
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  },

  build: {
    outDir: 'dist',
    sourcemap: false
  }
});
```
