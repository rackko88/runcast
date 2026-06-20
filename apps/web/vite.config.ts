import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react({
      babel: { plugins: ['@emotion/babel-plugin'] },
      jsxImportSource: '@emotion/react',
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@runcast/ui': path.resolve(__dirname, '../../packages/ui/src'),
    },
  },
  server: {
    proxy: {
      '/hrfco-api': {
        target: 'https://api.hrfco.go.kr',
        changeOrigin: true,
        rewrite: (p: string) => p.replace(/^\/hrfco-api/, ''),
      },
      '/kma-api': {
        target: 'https://apihub.kma.go.kr',
        changeOrigin: true,
        rewrite: (p: string) => p.replace(/^\/kma-api/, ''),
      },
      '/api': { target: 'http://localhost:3000', changeOrigin: true },
    },
  },
});
