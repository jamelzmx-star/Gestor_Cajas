import React from 'react'
import { NavLink } from 'react-router-dom'

const tabs = [
  { to: '/',         icono: '🏠', label: 'Inicio'   },
  { to: '/salidas',  icono: '📤', label: 'Salidas'  },
  { to: '/entradas', icono: '📥', label: 'Entradas' },
  { to: '/reporte',  icono: '📊', label: 'Reporte'  },
  { to: '/mas',      icono: '☰', label: 'Más'       },
]

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      {tabs.map(tab => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.to === '/'}  // "end" para que "/" no quede activo en otras rutas
          className={({ isActive }) => `nav-item ${isActive ? 'activo' : ''}`}
        >
          <span className="nav-icon">{tab.icono}</span>
          <span>{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
