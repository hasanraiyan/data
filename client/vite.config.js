import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react(), ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://data-rqkl.onrender.com/api',
        changeOrigin: true,
      },
    },
  },
})