import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// The Python API runs as Vercel serverless functions under /api. Locally we
// run everything through `vercel dev`, which serves this Vite app and proxies
// /api/* to the functions on a single origin — so the app calls the API with
// relative paths (/api/catalog, /api/quote) and needs no proxy config here.
export default defineConfig({
  plugins: [react(), tailwindcss()],
})
