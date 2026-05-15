import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// ⚠️  IMPORTANTE: Cambia 'TU-REPO' por el nombre exacto de tu repositorio en GitHub
// Ejemplo: si tu repo se llama "Gestor_Cajas", pon base: '/Gestor_Cajas/'
export default defineConfig({
  plugins: [react()],
  base: '/Gestor_Cajas/',
})
