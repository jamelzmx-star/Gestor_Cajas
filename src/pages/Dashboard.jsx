import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { useToast } from '../components/Toast.jsx'
import { hoy, fechaLegible, formatDinero } from '../utils/helpers.js'

export default function Dashboard() {
  const {
    inventario, personas,
    getTotalSalidas, getTotalEntradas,
    getInventarioActual, getTotalPagoDia,
    setInventario, setNota, notas,
  } = useApp()

  const toast    = useToast()
  const navigate = useNavigate()
  const fecha    = hoy()

  const invInicial   = inventario[fecha] ?? ''
  const totalSalidas = getTotalSalidas(fecha)
  const totalEntradas= getTotalEntradas(fecha)
  const invActual    = getInventarioActual(fecha)
  const totalPago    = getTotalPagoDia(fecha)

  const [editInv, setEditInv]     = useState(false)
  const [nuevoInv, setNuevoInv]   = useState('')
  const [nota, setNotaLocal]      = useState(notas[fecha] ?? '')

  function guardarInventario() {
    if (!nuevoInv || isNaN(nuevoInv)) return
    setInventario(fecha, Number(nuevoInv))
    setEditInv(false)
    toast('Inventario inicial guardado', 'exito')
  }

  function guardarNota() {
    setNota(fecha, nota)
    toast('Nota guardada', 'exito')
  }

  const sinInventario = inventario[fecha] == null

  return (
    <div className="pagina">

      {/* Aviso si no hay inventario inicial */}
      {sinInventario && (
        <div className="alerta alerta-aviso">
          ⚠️ No has registrado el inventario inicial de hoy
        </div>
      )}

      {/* Inventario inicial */}
      {(sinInventario || editInv) ? (
        <div className="inv-setter">
          <div className="inv-setter-titulo">📦 Inventario inicial de hoy</div>
          <div className="inv-setter-row">
            <input
              className="form-input"
              type="number"
              placeholder="Ej: 1000"
              value={nuevoInv}
              onChange={e => setNuevoInv(e.target.value)}
              autoFocus
            />
            <button className="btn btn-primario" onClick={guardarInventario}>
              Guardar
            </button>
          </div>
        </div>
      ) : null}

      {/* KPIs principales */}
      <div className="kpi-grid">
        <div className="kpi" style={{ cursor: 'pointer' }} onClick={() => setEditInv(true)}>
          <span className="kpi-label">Inventario Inicial</span>
          <span className="kpi-valor azul">
            {inventario[fecha] != null ? inventario[fecha].toLocaleString() : '—'}
          </span>
          <span className="kpi-sub">Toca para editar</span>
        </div>

        <div className="kpi">
          <span className="kpi-label">Salidas</span>
          <span className="kpi-valor naranja">{totalSalidas.toLocaleString()}</span>
          <span className="kpi-sub">Entregadas hoy</span>
        </div>

        <div className="kpi">
          <span className="kpi-label">Entradas</span>
          <span className="kpi-valor verde">{totalEntradas.toLocaleString()}</span>
          <span className="kpi-sub">Regresadas hoy</span>
        </div>

        <div className="kpi">
          <span className="kpi-label">En campo</span>
          <span className={`kpi-valor ${invActual < 0 ? 'rojo' : ''}`}>
            {(totalSalidas - totalEntradas).toLocaleString()}
          </span>
          <span className="kpi-sub">Sin regresar</span>
        </div>
      </div>

      {/* Total a pagar */}
      <div className="kpi-total">
        <div className="kpi-label">💰 Total a pagar hoy</div>
        <div className="kpi-valor" style={{ fontSize: '2.2rem' }}>
          {formatDinero(totalPago)}
        </div>
        <div style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: 4 }}>
          {personas.length} persona{personas.length !== 1 ? 's' : ''} registradas
        </div>
      </div>

      {/* Inventario actual */}
      <div className="card">
        <div className="kpi-label" style={{ marginBottom: 8 }}>📦 Estado del inventario</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: 'var(--gris-5)', fontSize: '0.9rem' }}>Inventario actual</span>
          <span style={{
            fontSize: '1.4rem',
            fontWeight: 800,
            color: invActual < 0 ? 'var(--rojo)' : 'var(--negro)'
          }}>
            {invActual.toLocaleString()}
          </span>
        </div>
        {invActual < 0 && (
          <div className="alerta alerta-error" style={{ marginTop: 8 }}>
            ⚠️ El inventario está en negativo
          </div>
        )}
      </div>

      {/* Accesos rápidos */}
      <div className="card">
        <div className="kpi-label" style={{ marginBottom: 12 }}>⚡ Accesos rápidos</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <button className="btn btn-primario" onClick={() => navigate('/salidas')}>
            📤 Registrar salida
          </button>
          <button className="btn btn-verde" onClick={() => navigate('/entradas')}>
            📥 Registrar entrada
          </button>
          <button className="btn btn-gris" onClick={() => navigate('/reporte')}>
            📊 Ver reporte
          </button>
          <button className="btn btn-gris" onClick={() => navigate('/planeacion')}>
            📅 Planeación
          </button>
        </div>
      </div>

      {/* Nota del día */}
      <div className="card">
        <div className="kpi-label" style={{ marginBottom: 8 }}>📝 Nota del día</div>
        <textarea
          className="form-textarea"
          placeholder="Escribe una nota para hoy..."
          value={nota}
          onChange={e => setNotaLocal(e.target.value)}
          onBlur={guardarNota}
        />
        <button
          className="btn btn-gris btn-sm"
          style={{ marginTop: 8 }}
          onClick={guardarNota}
        >
          Guardar nota
        </button>
      </div>

    </div>
  )
}
