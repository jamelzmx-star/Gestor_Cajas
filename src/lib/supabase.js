import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !key) {
  console.error(
    '⚠️ Faltan variables de entorno de Supabase.\n' +
    'Crea el archivo .env.local con VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY'
  )
}

export const supabase = createClient(url, key)
