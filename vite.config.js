import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  server: {
    proxy: {
      '/hrfco-api': {
        target: 'https://api.hrfco.go.kr',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/hrfco-api/, ''),
      },
      '/kma-api': {
        target: 'https://apihub.kma.go.kr',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/kma-api/, ''),
      },
      // /api/* → vercel dev (port 3000) when running locally
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
