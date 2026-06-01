import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// The Python API runs as Vercel serverless functions under /api. Locally we
// run everything through `vercel dev`, which serves this Vite app and proxies
// /api/* to the functions on a single origin — so the app calls the API with
// relative paths (/api/catalog, /api/quote) and needs no proxy config here.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // @react-pdf/renderer is large but is dynamically imported (loaded only
    // when a user downloads their ticket), so it lands in its own lazy chunk
    // and never bloats the initial bundle. Raise the warning limit to reflect
    // that this big chunk is intentional and off the critical path.
    chunkSizeWarningLimit: 1600,
  },
})
