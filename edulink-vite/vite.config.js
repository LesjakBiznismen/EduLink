import process from 'node:process'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Zahteve /api posreduje strežniku EduLink (mapa backend/, privzeto vrata 3000).
    proxy: {
      '/api': process.env.VITE_API_TARGET || 'http://localhost:3000',
    },
  },
})
