import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { fechaLegible, hoy } from '../utils/helpers.js'

const titulos = {
  '/':                     '📦 Control de Cajas',
  '/salidas':              '📤 Salidas',
  '/entradas':             '📥 Entradas',
  '/reporte':              '📊 Reporte del Día',
  '/planeacion':           '📅 Planeación',
  '/personas':             '👥 Personas',
  '/historial':            '📋 Historial',
  '/categorias':           '🗂️ Categorías',
  '/precios':              '💲 Precios del Día',
  '/exportar':             '📤 Exportar',
  '/mas':                  '☰ Más opciones',
  '/historial-salidas':    '📤 Historial de Salidas',
  '/historial-entradas':   '📥 Historial de Entradas',
  '/admin':                '⚙️ Administración',
}

const paginasInternas = [
  '/planeacion', '/personas', '/historial',
  '/categorias', '/precios', '/exportar', '/mas',
  '/historial-salidas', '/historial-entradas', '/admin',
]

export default function Header() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { perfil, esAdmin, signOut } = useAuth()

  const [menuUsuario, setMenuUsuario] = useState(false)

  const ruta    = location.pathname
  const titulo  = titulos[ruta] ?? '📦 Control de Cajas'
  const mostrarBack = paginasInternas.some(p => ruta.startsWith(p))

  async function cerrarSesion() {
    setMenuUsuario(false)
    await signOut()
  }

  return (
    <>
      <header className="header">
        {mostrarBack && (
          <button className="header-back" onClick={() => navigate(-1)}>
            ‹
          </button>
        )}

        <span className="header-titulo">{titulo}</span>

        {ruta === '/' && (
          <span className="header-fecha">{fechaLegible(hoy())}</span>
        )}

        {/* Botón de usuario */}
        <button
          onClick={() => setMenuUsuario(v => !v)}
          style={{
            background: 'rgba(255,255,255,0.15)',
            border: 'none',
            borderRadius: '50%',
            width: 34,
            height: 34,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '1.1rem',
            marginLeft: 8,
            flexShrink: 0,
          }}
          title="Cuenta"
        >
          {esAdmin ? '👑' : '👤'}
        </button>
      </header>

      {/* Menú desplegable de usuario */}
      {menuUsuario && (
        <>
          {/* Overlay para cerrar */}
          <div
            onClick={() => setMenuUsuario(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 150,
              background: 'transparent',
            }}
          />
          <div style={{
            position: 'fixed',
            top: 'calc(var(--alto-header) + 8px)',
            right: 8,
            zIndex: 160,
            background: 'var(--blanco)',
            borderRadius: 'var(--radio)',
            boxShadow: 'var(--sombra-md)',
            minWidth: 220,
            overflow: 'hidden',
            border: '1px solid var(--gris-3)',
          }}>

            {/* Info del usuario */}
            <div style={{
              padding: '14px 16px',
              background: 'var(--gris-2)',
              borderBottom: '1px solid var(--gris-3)',
            }}>
              <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>
                {esAdmin ? '👑 ' : '👤 '}{perfil?.nombre ?? 'Usuario'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--gris-5)', marginTop: 2 }}>
                {perfil?.email}
              </div>
              {perfil?.suscripcion_hasta && (
                <div style={{ fontSize: '0.72rem', color: 'var(--gris-4)', marginTop: 4 }}>
                  Vence: {perfil.suscripcion_hasta}
                </div>
              )}
            </div>

            {/* Opción Admin */}
            {esAdmin && (
              <button
                onClick={() => { navigate('/admin'); setMenuUsuario(false) }}
                style={{
                  width: '100%', textAlign: 'left',
                  padding: '12px 16px', border: 'none',
                  background: 'none', cursor: 'pointer',
                  fontFamily: 'inherit', fontSize: '0.9rem',
                  fontWeight: 600, color: 'var(--azul)',
                  borderBottom: '1px solid var(--gris-3)',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}
              >
                ⚙️ Panel de Administración
              </button>
            )}

            {/* Cerrar sesión */}
            <button
              onClick={cerrarSesion}
              style={{
                width: '100%', textAlign: 'left',
                padding: '12px 16px', border: 'none',
                background: 'none', cursor: 'pointer',
                fontFamily: 'inherit', fontSize: '0.9rem',
                fontWeight: 600, color: 'var(--rojo)',
                display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              🚪 Cerrar sesión
            </button>
          </div>
        </>
      )}
    </>
  )
}
