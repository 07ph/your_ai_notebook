import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    strictPort: true, // 固定端口，避免端口变化导致 IndexedDB 数据隔离
  },
  ssr: {
    noExternal: ['ai', '@ai-sdk/openai', '@ai-sdk/openai-compatible'],
  },
})
