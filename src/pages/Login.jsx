import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext.jsx'

const STORAGE_EMAIL_KEY = 'cajas-control-email-guardado'

export default function Login() {
  const { signIn, signUp } = useAuth()

  const [tab,         setTab]         = useState('login')
  const [nombre,      setNombre]      = useState('')
  const [email,       setEmail]       = useState('')
  const [password,    setPassword]    = useState('')
  const [verPass,     setVerPass]     = useState(false)
  const [recordar,    setRecordar]    = useState(false)
  const [cargando,    setCargando]    = useState(false)
  const [error,       setError]       = useState('')
  const [exito,       setExito]       = useState('')

  // Cargar email guardado al iniciar
  useEffect(() => {
    const emailGuardado = localStorage.getItem(STORAGE_EMAIL_KEY)
    if (emailGuardado) {
      setEmail(emailGuardado)
      setRecordar(true)
    }
  }, [])

  function limpiar() { setError(''); setExito('') }

  async function handleLogin(e) {
    e.preventDefault()
    limpiar()
    if (!email || !password) return setError('Completa todos los campos')
    setCargando(true)
    try {
      await signIn(email, password)
      // Guardar o limpiar el email según la preferencia
      if (recordar) {
        localStorage.setItem(STORAGE_EMAIL_KEY, email)
      } else {
        localStorage.removeItem(STORAGE_EMAIL_KEY)
      }
    } catch (err) {
      setError(traducirError(err.message))
    } finally {
      setCargando(false)
    }
  }

  async function handleRegistro(e) {
    e.preventDefault()
    limpiar()
    if (!nombre || !email || !password) return setError('Completa todos los campos')
    if (password.length < 6)            return setError('La contraseña debe tener al menos 6 caracteres')
    setCargando(true)
    try {
      await signUp(email, password, nombre)
      setExito('¡Cuenta creada! El administrador debe activarla antes de que puedas entrar.')
      setTab('login')
      setNombre('')
      setPassword('')
    } catch (err) {
      setError(traducirError(err.message))
    } finally {
      setCargando(false)
    }
  }

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'linear-gradient(135deg, var(--azul) 0%, #1e3a8a 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px 16px',
    }}>
      <div style={{
        width: '100%', maxWidth: 400,
        background: 'var(--blanco)',
        borderRadius: 20, padding: '32px 24px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: '2.8rem', lineHeight: 1, marginBottom: 8 }}>📦</div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--negro)', letterSpacing: '-0.02em' }}>
            Control de Cajas
          </h1>
          <p style={{ fontSize: '0.82rem', color: 'var(--gris-5)', marginTop: 4 }}>
            {tab === 'login' ? 'Inicia sesión para continuar' : 'Crea tu cuenta'}
          </p>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', background: 'var(--gris-2)',
          borderRadius: 'var(--radio-sm)', padding: 4, marginBottom: 24, gap: 4,
        }}>
          {['login', 'registro'].map(t => (
            <button key={t} onClick={() => { setTab(t); limpiar() }} style={{
              flex: 1, padding: '10px', border: 'none', borderRadius: 6,
              fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer',
              background: tab === t ? 'var(--blanco)' : 'transparent',
              color: tab === t ? 'var(--azul)' : 'var(--gris-5)',
              boxShadow: tab === t ? 'var(--sombra)' : 'none',
              transition: 'all 0.15s', fontFamily: 'inherit',
            }}>
              {t === 'login' ? '🔐 Entrar' : '✏️ Registrarse'}
            </button>
          ))}
        </div>

        {/* Mensajes */}
        {error && <div className="alerta alerta-error" style={{ marginBottom: 16 }}>❌ {error}</div>}
        {exito && <div className="alerta alerta-exito" style={{ marginBottom: 16 }}>✅ {exito}</div>}

        {/* ── Formulario Login ── */}
        {tab === 'login' && (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            <div className="form-group">
              <label className="form-label">Correo electrónico</label>
              <input
                className="form-input"
                type="email"
                placeholder="tu@correo.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Contraseña</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="form-input"
                  type={verPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  style={{ paddingRight: 48 }}
                />
                <button type="button" onClick={() => setVerPass(v => !v)} style={{
                  position: 'absolute', right: 12, top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem',
                }}>
                  {verPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Recordar correo */}
            <label style={{
              display: 'flex', alignItems: 'center', gap: 10,
              cursor: 'pointer', userSelect: 'none',
              fontSize: '0.88rem', color: 'var(--gris-6)',
            }}>
              <div
                onClick={() => setRecordar(v => !v)}
                style={{
                  width: 20, height: 20, borderRadius: 5,
                  border: `2px solid ${recordar ? 'var(--azul)' : 'var(--gris-3)'}`,
                  background: recordar ? 'var(--azul)' : 'var(--blanco)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s', flexShrink: 0,
                }}
              >
                {recordar && <span style={{ color: 'white', fontSize: '0.75rem', fontWeight: 900 }}>✓</span>}
              </div>
              Recordar mi correo
            </label>

            {/* Info sesión activa */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'var(--verde-bg)', borderRadius: 'var(--radio-sm)',
              padding: '8px 12px', fontSize: '0.78rem', color: 'var(--verde)',
            }}>
              <span style={{ fontSize: '1rem' }}>🔒</span>
              <span>Tu sesión se mantiene activa aunque cierres el navegador</span>
            </div>

            <button className="btn btn-primario btn-bloque" type="submit" disabled={cargando} style={{ marginTop: 4 }}>
              {cargando ? '⏳ Entrando...' : '🔐 Iniciar sesión'}
            </button>
          </form>
        )}

        {/* ── Formulario Registro ── */}
        {tab === 'registro' && (
          <form onSubmit={handleRegistro} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            <div className="form-group">
              <label className="form-label">Tu nombre</label>
              <input
                className="form-input"
                type="text"
                placeholder="Nombre completo"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                autoComplete="name"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Correo electrónico</label>
              <input
                className="form-input"
                type="email"
                placeholder="tu@correo.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Contraseña</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="form-input"
                  type={verPass ? 'text' : 'password'}
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="new-password"
                  style={{ paddingRight: 48 }}
                />
                <button type="button" onClick={() => setVerPass(v => !v)} style={{
                  position: 'absolute', right: 12, top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem',
                }}>
                  {verPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <div style={{
              background: 'var(--azul-fondo)', borderRadius: 'var(--radio-sm)',
              padding: '10px 12px', fontSize: '0.78rem', color: 'var(--azul)', lineHeight: 1.5,
            }}>
              ℹ️ Después de registrarte, el administrador debe activar tu cuenta antes de que puedas entrar.
            </div>

            <button className="btn btn-primario btn-bloque" type="submit" disabled={cargando}>
              {cargando ? '⏳ Creando cuenta...' : '✅ Crear cuenta'}
            </button>
          </form>
        )}

      </div>
    </div>
  )
}

function traducirError(msg = '') {
  if (msg.includes('Invalid login credentials'))  return 'Correo o contraseña incorrectos'
  if (msg.includes('Email not confirmed'))         return 'Confirma tu correo antes de entrar'
  if (msg.includes('User already registered'))     return 'Este correo ya está registrado'
  if (msg.includes('Password should be'))          return 'La contraseña debe tener al menos 6 caracteres'
  if (msg.includes('Unable to validate'))          return 'Correo inválido'
  if (msg.includes('rate limit'))                  return 'Demasiados intentos. Espera un momento.'
  return msg
}
