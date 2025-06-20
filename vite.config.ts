import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      src: resolve(__dirname, 'src'),
      components: resolve(__dirname, 'src/components'),
      containers: resolve(__dirname, 'src/containers'),
      context: resolve(__dirname, 'src/context'),
      css: resolve(__dirname, 'src/css'),
      images: resolve(__dirname, 'src/images'),
      layouts: resolve(__dirname, 'src/layouts'),
      pages: resolve(__dirname, 'src/pages'),
      scripts: resolve(__dirname, 'src/scripts'),
      services: resolve(__dirname, 'src/services'),
      store: resolve(__dirname, 'src/store'),
      hooks: resolve(__dirname, 'src/hooks'),
      queries: resolve(__dirname, 'src/queries.ts'),
    },
  },
  base: '/',
  server: {
    port: 3000,
  },
  build: {
    outDir: 'build',
  },
  define: {
    'process.env': {},
  },
  preview: {
    port: 3000,
  },
}); 