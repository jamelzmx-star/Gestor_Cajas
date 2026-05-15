import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext.jsx'
import Header    from './components/Header.jsx'
import BottomNav from './components/BottomNav.jsx'
import { ToastProvider } from './components/Toast.jsx'

import Login     from './pages/Login.jsx'
import Admin     from './pages/Admin.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Salidas   from './pages/Salidas.jsx'
import Entradas  from './pages/Entradas.jsx'
import Reporte   from './pages/Reporte.jsx'
import Mas       from './pages/Mas.jsx'
import Planeacion from './pages/Planeacion.jsx'
import Personas  from './pages/Personas.jsx'
import Historial from './pages/Historial.jsx'
import Categorias from './pages/Categorias.jsx'
import Precios   from './pages/Precios.jsx'
import Exportar  from './pages/Exportar.jsx'
import HistorialSalidas  from './pages/HistorialSalidas.jsx'
import HistorialEntradas from './pages/HistorialEntradas.jsx'

// ── Pantalla de cuenta bloqueada ────────────────────────────
function CuentaBloqueada({ mensaje, onSalir }) {
  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24, background: 'var(--gris-2)',
    }}>
      <div style={{
        background: 'var(--blanco)', borderRadius: 16, padding: 32,
        maxWidth: 360, width: '100%', textAlign: 'center',
        boxShadow: 'var(--sombra-md)',
      }}>
        <div style={{ fontSize: '3rem', marginBottom: 12 }}>🔒</div>
        <h2 style={{ fontWeight: 800, marginBottom: 8 }}>Acceso restringido</h2>
        <p style={{ color: 'var(--gris-6)', lineHeight: 1.6, marginBottom: 20 }}>
          {mensaje}
        </p>
        <button className="btn btn-gris btn-bloque" onClick={onSalir}>
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}

// ── Pantalla de carga inicial ───────────────────────────────
function Cargando() {
  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', flexDirection: 'column', gap: 16,
      background: 'var(--azul)',
    }}>
      <div style={{ fontSize: '3rem' }}>📦</div>
      <div style={{ color: 'white', fontWeight: 700 }}>Cargando...</div>
    </div>
  )
}

// ── Banner de suscripción por vencer (dentro de la app) ─────
function BannerSuscripcion() {
  const { getMensajeCuenta } = useAuth()
  const msg = getMensajeCuenta()
  if (!msg || msg.tipo !== 'aviso') return null
  return (
    <div className="alerta alerta-aviso" style={{
      margin: '8px 16px 0',
      borderRadius: 'var(--radio-sm)',
    }}>
      ⚠️ {msg.texto}
    </div>
  )
}

// ── App principal ───────────────────────────────────────────
export default function App() {
  const { user, perfil, cargando, perfilCargando, tieneAcceso, esAdmin, getMensajeCuenta, signOut } = useAuth()

  // 1. Cargando sesión inicial o perfil del usuario
  if (cargando || perfilCargando) return <Cargando />

  // 2. Sin sesión → login
  if (!user) return (
    <ToastProvider>
      <Login />
    </ToastProvider>
  )

  // 3. Tiene sesión pero no tiene acceso (inactivo o vencido)
  if (!tieneAcceso) {
    const msg = getMensajeCuenta()
    return (
      <CuentaBloqueada
        mensaje={msg?.texto ?? 'Tu cuenta no tiene acceso. Contacta al administrador.'}
        onSalir={async () => { await signOut(); window.location.reload() }}
      />
    )
  }

  // 4. Tiene acceso → mostrar la app completa
  return (
    <ToastProvider>
      <Header />
      <BannerSuscripcion />
      <main className="app-container">
        <Routes>
          <Route path="/"           element={<Dashboard />}  />
          <Route path="/salidas"    element={<Salidas />}    />
          <Route path="/entradas"   element={<Entradas />}   />
          <Route path="/reporte"    element={<Reporte />}    />
          <Route path="/mas"        element={<Mas />}        />
          <Route path="/planeacion" element={<Planeacion />} />
          <Route path="/personas"   element={<Personas />}   />
          <Route path="/historial/:personaId" element={<Historial />} />
          <Route path="/categorias" element={<Categorias />} />
          <Route path="/precios"    element={<Precios />}    />
          <Route path="/exportar"   element={<Exportar />}   />
          <Route path="/historial-salidas"  element={<HistorialSalidas />}  />
          <Route path="/historial-entradas" element={<HistorialEntradas />} />
          {/* Ruta de admin — solo accesible si es admin */}
          <Route
            path="/admin"
            element={esAdmin ? <Admin /> : <Navigate to="/" replace />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <BottomNav />
    </ToastProvider>
  )
}
