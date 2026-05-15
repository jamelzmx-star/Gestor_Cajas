import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { fechaCorta, fechaLegible, formatDinero, getNombre } from '../utils/helpers.js'
import { hoy } from '../utils/helpers.js'

export default function Historial() {
  const { personaId } = useParams()
  const { personas, categorias, getHistorialPersona, getPagoPersonaDia } = useApp()
  const navigate = useNavigate()

  const persona  = personas.find(p => p.id === personaId)
  const historial = getHistorialPersona(personaId)

  if (!persona) {
    return (
      <div className="pagina">
        <div className="alerta alerta-error">
          Persona no encontrada.
          <button className="btn btn-gris btn-sm" style={{ marginLeft: 8 }} onClick={() => navigate('/personas')}>
            Regresar
          </button>
        </div>
      </div>
    )
  }

  const mesActual = hoy().slice(0, 7)

  const totalGeneral = historial.reduce((a, h) => a + h.pago, 0)
  const totalMes     = historial
    .filter(h => h.fecha.startsWith(mesActual))
    .reduce((a, h) => a + h.pago, 0)
  const diasTrabajados = historial.length
  const pagoHoy = getPagoPersonaDia(personaId, hoy())

  return (
    <div className="pagina">

      {/* Nombre */}
      <div className="card">
        <div style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 4 }}>
          👤 {persona.nombre}
        </div>
        <div style={{ color: 'var(--gris-5)', fontSize: '0.85rem' }}>
          {diasTrabajados} días con registros
        </div>
      </div>

      {/* Resumen */}
      <div className="historial-resumen">
        <div className="historial-kpi">
          <div className="historial-kpi-val text-verde">{formatDinero(pagoHoy)}</div>
          <div className="historial-kpi-label">Hoy</div>
        </div>
        <div className="historial-kpi">
          <div className="historial-kpi-val">{formatDinero(totalMes)}</div>
          <div className="historial-kpi-label">Este mes</div>
        </div>
        <div className="historial-kpi">
          <div className="historial-kpi-val">{formatDinero(totalGeneral)}</div>
          <div className="historial-kpi-label">Total</div>
        </div>
      </div>

      {/* Historial por día */}
      <div className="card">
        <div className="kpi-label" style={{ marginBottom: 12 }}>
          📋 Historial por día
        </div>

        {historial.length === 0 ? (
          <div className="vacío">
            <span className="vacío-icono">📋</span>
            Sin registros aún
          </div>
        ) : (
          <div className="lista">
            {historial.map(h => (
              <div key={h.fecha} style={{
                padding: '12px 0',
                borderBottom: '1px solid var(--gris-3)',
              }}>
                {/* Fecha */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontWeight: 700, color: 'var(--gris-6)' }}>
                    {fechaLegible(h.fecha)}
                  </span>
                  <span style={{ fontWeight: 800, color: 'var(--verde)', fontSize: '1rem' }}>
                    {formatDinero(h.pago)}
                  </span>
                </div>

                {/* Cajas entregadas */}
                {h.totalEntregadas > 0 && (
                  <div style={{ fontSize: '0.82rem', color: 'var(--gris-5)', marginBottom: 4 }}>
                    📤 Entregadas: <strong>{h.totalEntregadas.toLocaleString()}</strong>
                  </div>
                )}

                {/* Desglose por categoría */}
                {h.entradas.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {h.entradas.map(e => (
                      <span key={e.id} className="etiqueta etiqueta-azul">
                        {getNombre(categorias, e.categoriaId)}: {e.cantidad}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
