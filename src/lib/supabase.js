import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

// Valores de respaldo para evitar que la app crashee si faltan las variables
// (mostrará error de conexión en lugar de pantalla en blanco)
const supabaseUrl  = url  || 'https://zzfwvdrhmlsdyaleffjq.supabase.co'
const supabaseKey  = key  || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6Znd2ZHJobWxzZHlhbGVmZmpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4MDk3MTAsImV4cCI6MjA5NDM4NTcxMH0.G8Ush0jmwqdxKDl1sZwwtns258c9SYmEPhzKVVGtjZ0'

export const supabase = createClient(supabaseUrl, supabaseKey)

// Exportar si las credenciales están configuradas
export const supabaseConfigurado = Boolean(url && key)