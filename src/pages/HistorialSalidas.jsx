import React, { useState } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { hoy, fechaLegible, getNombre } from '../utils/helpers.js'

export default function HistorialSalidas() {
  const { personas, getSalidasDia, inventario, getTotalEntradas } = useApp()
  const [fecha, setFecha] = useState(hoy())

  const salidas      = getSalidasDia(fecha)
  const totalSalidas = salidas.reduce((a, s) => a + s.cantidad, 0)
  const invInicial   = inventario[fecha] ?? 0
  const enCampo      = totalSalidas - getTotalEntradas(fecha)

  return (
    <div className="pagina">

      {/* Selector de fecha */}
      <div className="card">
        <div className="kpi-label" style={{ marginBottom: 8 }}>📅 Selecciona el día</div>
        <input
          type="date"
          className="form-input"
          value={fecha}
          max={hoy()}
          onChange={e => setFecha(e.target.value)}
        />
        <div style={{ marginTop: 6, fontSize: '0.82rem', color: 'var(--gris-5)' }}>
          {fechaLegible(fecha)}
        </div>
      </div>

      {/* KPIs del día */}
      <div className="kpi-grid">
        <div className="kpi">
          <span className="kpi-label">Inv. inicial</span>
          <span className="kpi-valor azul">{invInicial.toLocaleString()}</span>
        </div>
        <div className="kpi">
          <span className="kpi-label">Total salidas</span>
          <span className="kpi-valor naranja">{totalSalidas.toLocaleString()}</span>
        </div>
        <div className="kpi">
          <span className="kpi-label">En campo</span>
          <span className="kpi-valor">{enCampo.toLocaleString()}</span>
          <span className="kpi-sub">Sin regresar</span>
        </div>
        <div className="kpi">
          <span className="kpi-label">Disponible</span>
          <span className="kpi-valor verde">
            {(invInicial - totalSalidas).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Lista */}
      <div className="card">
        <div className="kpi-label" style={{ marginBottom: 12 }}>
          📋 Salidas del día ({salidas.length})
        </div>

        {salidas.length === 0 ? (
          <div className="vacío">
            <span className="vacío-icono">📭</span>
            No hay salidas registradas para este día
          </div>
        ) : (
          <div className="lista">
            {salidas.map(s => (
              <div key={s.id} className="lista-item">
                <div style={{
                  width: 42, height: 42, borderRadius: 'var(--radio-sm)',
                  background: 'var(--naranja-bg)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.3rem', flexShrink: 0,
                }}>
                  📤
                </div>
                <div className="lista-item-info">
                  <div className="lista-item-nombre">
                    {getNombre(personas, s.personaId)}
                  </div>
                  <div className="lista-item-sub">
                    {s.cantidad.toLocaleString()} cajas entregadas
                  </div>
                </div>
                <div style={{
                  fontWeight: 800, fontSize: '1.1rem',
                  color: 'var(--naranja)', textAlign: 'right',
                }}>
                  {s.cantidad.toLocaleString()}
                </div>
              </div>
            ))}

            {/* Totales por persona */}
            <div style={{
              marginTop: 4,
              paddingTop: 12,
              borderTop: '2px solid var(--gris-3)',
            }}>
              <div className="kpi-label" style={{ marginBottom: 8 }}>Resumen por persona</div>
              {personas
                .map(p => {
                  const total = salidas
                    .filter(s => s.personaId === p.id)
                    .reduce((a, s) => a + s.cantidad, 0)
                  return { persona: p, total }
                })
                .filter(x => x.total > 0)
                .map(x => (
                  <div key={x.persona.id} style={{
                    display: 'flex', justifyContent: 'space-between',
                    padding: '6px 0', borderBottom: '1px solid var(--gris-3)',
                    fontSize: '0.9rem',
                  }}>
                    <span style={{ fontWeight: 600 }}>{x.persona.nombre}</span>
                    <span style={{ fontWeight: 800, color: 'var(--naranja)' }}>
                      {x.total.toLocaleString()} cajas
                    </span>
                  </div>
                ))
              }
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                paddingTop: 10, fontWeight: 800,
              }}>
                <span>Total</span>
                <span className="text-naranja">{totalSalidas.toLocaleString()} cajas</span>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}
