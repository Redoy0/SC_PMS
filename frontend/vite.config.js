import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// In development the API is served from the same origin through this proxy,
// matching production (where Vercel/Netlify rewrite /api to the backend).
// Same-origin requests let the refresh-token cookie stay first-party.
const API_TARGET = process.env.VITE_DEV_API_TARGET || 'http://localhost:5000'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Fixed port: the backend's CLIENT_ORIGIN / socket CORS allow-list expects 5173
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': { target: API_TARGET, changeOrigin: true },
    },
  },
  preview: {
    proxy: {
      '/api': { target: API_TARGET, changeOrigin: true },
    },
  },
})
