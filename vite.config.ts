import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Served from the aubuildhub.com.au custom domain root — local dev also stays at /
export default defineConfig(() => ({
  plugins: [react(), tailwindcss()],
  base: '/',
}))
