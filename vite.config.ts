import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages serves project sites from /<repository-name>/.
  // Locally, keep the usual root path for the Vite dev server.
  base: process.env.GITHUB_ACTIONS === 'true'
    ? `/${process.env.GITHUB_REPOSITORY?.split('/')[1] ?? ''}/`
    : '/',
  plugins: [react()],
  assetsInclude: ['**/*.glb'],
})
