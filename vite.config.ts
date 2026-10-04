import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages serves the site from /CineMate/; set BASE_PATH=/ for other hosts
export default defineConfig({ base: process.env.BASE_PATH ?? '/', plugins: [react()] })
