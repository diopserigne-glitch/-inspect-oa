import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: './' → chemins relatifs, fonctionne aussi bien à la racine d'un domaine
// que dans un sous-chemin GitHub Pages (https://user.github.io/inspect-oa/).
export default defineConfig({
  base: './',
  plugins: [react()],
})
