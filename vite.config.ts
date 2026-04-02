import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/Trade-App/',
  build: {
    outDir: 'dist',
  },
})