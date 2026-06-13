import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    // allowedHosts: true is deprecated in Vite 6+; use the array form or omit for dev
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      },
      '/socket.io': {
        target: 'http://localhost:5000',
        ws: true,
        changeOrigin: true
      }
    }
  },
  build: {
    // Raise the chunk warning limit slightly (jsPDF + chart.js are large)
    chunkSizeWarningLimit: 800
  }
})
