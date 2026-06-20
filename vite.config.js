import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
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
    },
  },
})
