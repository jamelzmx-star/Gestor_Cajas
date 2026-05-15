import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const opciones = [
  { to: '/planeacion',        icono: '📅', color: 'azul',    nombre: 'Planeación',            desc: 'Organiza las cajas para mañana' },
  { to: '/personas',          icono: '👥', color: 'verde',   nombre: 'Personas',              desc: 'Agrega o consulta el historial de cada persona' },
  { to: '/historial-salidas', icono: '📤', color: 'naranja', nombre: 'Historial de Salidas',  desc: 'Ve las salidas de cualquier día anterior' },
  { to: '/historial-entradas',icono: '📥', color: 'verde',   nombre: 'Historial de Entradas', desc: 'Ve las entradas y pagos de cualquier día anterior' },
  { to: '/precios',           icono: '💲', color: 'verde',   nombre: 'Precios del día',       desc: 'Establece el precio por categoría' },
  { to: '/categorias',        icono: '🗂️', color: 'naranja', nombre: 'Categorías',            desc: 'Agrega o desactiva tipos de caja' },
  { to: '/exportar',          icono: '📊', color: 'gris',    nombre: 'Exportar a Excel',      desc: 'Descarga los datos en formato Excel' },
]

const opcionAdmin = {
  to: '/admin', icono: '⚙️', color: 'azul',
  nombre: 'Administración', desc: 'Gestiona usuarios y suscripciones',
}

export default function Mas() {
  const navigate    = useNavigate()
  const { esAdmin } = useAuth()

  const lista = esAdmin ? [opcionAdmin, ...opciones] : opciones

  return (
    <div className="menu-mas">
      <div style={{
        fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase',
        letterSpacing: '0.06em', color: 'var(--gris-5)', padding: '4px 0',
      }}>
        Opciones adicionales
      </div>

      {lista.map(op => (
        <button key={op.to} className="menu-mas-item" onClick={() => navigate(op.to)}>
          <div className={`menu-mas-icono ${op.color}`}>{op.icono}</div>
          <div className="menu-mas-texto">
            <div className="menu-mas-nombre">{op.nombre}</div>
            <div className="menu-mas-desc">{op.desc}</div>
          </div>
          <span className="menu-mas-flecha">›</span>
        </button>
      ))}
    </div>
  )
}
