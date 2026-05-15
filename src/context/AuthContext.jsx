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
  const [cargando,       setCargando]       = useState(true)   // sesión inicial
  const [perfilCargando, setPerfilCargando] = useState(false)  // carga del perfil

  async function cargarPerfil(userId) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      if (error) { console.error('Error perfil:', error); return null }
      return data
    } catch (e) {
      console.error('Error perfil:', e)
      return null
    }
  }

  useEffect(() => {
    // Si Supabase no está configurado, salir del loading de inmediato
    if (!supabaseConfigurado) {
      console.error('⚠️ Faltan VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY')
      setCargando(false)
      return
    }

    const timeout = setTimeout(() => setCargando(false), 8000)

    supabase.auth.getSession()
      .then(async ({ data: { session } }) => {
        clearTimeout(timeout)
        if (session?.user) {
          setUser(session.user)
          setPerfilCargando(true)
          const p = await cargarPerfil(session.user.id)
          setPerfil(p)
          setPerfilCargando(false)
        }
        setCargando(false)
      })
      .catch(() => {
        clearTimeout(timeout)
        setCargando(false)
      })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'INITIAL_SESSION') return

        if (session?.user) {
          setUser(session.user)
          setPerfilCargando(true)
          const p = await cargarPerfil(session.user.id)
          if (p !== null) setPerfil(p)
          setPerfilCargando(false)
        } else {
          setUser(null)
          setPerfil(null)
          setPerfilCargando(false)
          setCargando(false)
        }
      }
    )

    return () => { clearTimeout(timeout); subscription.unsubscribe() }
  }, [])

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  async function signUp(email, password, nombre) {
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { nombre } },
    })
    if (error) throw error
    return data
  }

  async function signOut() {
    try { await supabase.auth.signOut() } catch (e) { console.error(e) }
    finally {
      setUser(null)
      setPerfil(null)
      setPerfilCargando(false)
      setCargando(false)
    }
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

  const value = {
    user, perfil, cargando, perfilCargando,
    esAdmin, tieneAcceso, diasRestantes,
    suscripcionVencida, suscripcionPorVencer,
    getMensajeCuenta, signIn, signUp, signOut,
    recargarPerfil: () => {
      if (!user) return
      setPerfilCargando(true)
      cargarPerfil(user.id).then(p => {
        if (p) setPerfil(p)
        setPerfilCargando(false)
      })
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}