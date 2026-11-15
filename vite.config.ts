import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Relative asset URLs, so the same build runs from a sub-folder (GitHub Pages:
  // /animus-mundi-core/, itch.io's iframe) as well as from a site root.
  base: './',
})
