import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase, supabaseConfigurado } from '../lib/supabase.js'

const AuthContext = createContext(null)
const DIAS_AVISO = 7

function diasHasta(fechaISO) {
  if (!fechaISO) return null
  const hoy = new Date(); hoy.setHours(0,0,0,0)
  const vence = new Date(fechaISO + 'T00:00:00')
  return Math.ceil((vence - hoy) / (1000 * 60 * 60 * 24))
}

export function AuthProvider({ children }) {
  const [user,           setUser]           = useState(null)
  const [perfil,         setPerfil]         = useState(null)
  const [cargando,       setCargando]       = useState(true)
  const [perfilCargando, setPerfilCargando] = useState(false)

  async function cargarPerfil(userId) {
    try {
      const { data, error } = await supabase
        .from('profiles').select('*').eq('id', userId).single()
      if (data) return data
      if (error?.code === 'PGRST116') {
        const { data: u } = await supabase.auth.getUser()
        const email  = u?.user?.email ?? ''
        const nombre = u?.user?.user_metadata?.nombre ?? email.split('@')[0]
        const { data: nuevo } = await supabase
          .from('profiles')
          .insert({ id: userId, email, nombre, activo: false })
          .select().single()
        return nuevo ?? null
      }
      return null
    } catch (e) { return null }
  }

  useEffect(() => {
    if (!supabaseConfigurado) { setCargando(false); return }
    const timeout = setTimeout(() => { setCargando(false); setPerfilCargando(false) }, 10000)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'TOKEN_REFRESHED') { clearTimeout(timeout); setCargando(false); return }
        clearTimeout(timeout)
        if (session?.user) {
          setUser(session.user)
          setPerfilCargando(true)
          try { const p = await cargarPerfil(session.user.id); setPerfil(p) }
          finally { setPerfilCargando(false) }
        } else {
          setUser(null); setPerfil(null); setPerfilCargando(false)
        }
        setCargando(false)
      }
    )
    return () => { clearTimeout(timeout); subscription.unsubscribe() }
  }, [])

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error; return data
  }
  async function signUp(email, password, nombre) {
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { nombre } } })
    if (error) throw error; return data
  }
  async function signOut() {
    try { await supabase.auth.signOut() } catch (e) { console.error(e) }
    window.location.reload()
  }

  const esAdmin              = perfil?.es_admin === true
  const diasRestantes        = diasHasta(perfil?.suscripcion_hasta)
  const suscripcionVencida   = diasRestantes !== null && diasRestantes < 0
  const suscripcionPorVencer = diasRestantes !== null && diasRestantes >= 0 && diasRestantes <= DIAS_AVISO
  const tieneAcceso          = perfil?.activo === true && !suscripcionVencida

  function getMensajeCuenta() {
    if (!perfil) return null
    if (!perfil.activo)       return { tipo: 'error', texto: 'Tu cuenta está desactivada. Contacta al administrador.' }
    if (suscripcionVencida)   return { tipo: 'error', texto: `Tu suscripción venció hace ${Math.abs(diasRestantes)} día(s).` }
    if (suscripcionPorVencer) return { tipo: 'aviso', texto: `Tu suscripción vence en ${diasRestantes} día(s). Renueva pronto.` }
    return null
  }

  return (
    <AuthContext.Provider value={{
      user, perfil, cargando, perfilCargando, esAdmin, tieneAcceso,
      diasRestantes, suscripcionVencida, suscripcionPorVencer,
      getMensajeCuenta, signIn, signUp, signOut,
      recargarPerfil: () => {
        if (!user) return
        setPerfilCargando(true)
        cargarPerfil(user.id).then(p => { if (p) setPerfil(p) }).finally(() => setPerfilCargando(false))
      },
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}