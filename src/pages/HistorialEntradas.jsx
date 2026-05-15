import React, { useState } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { hoy, fechaLegible, getNombre, formatDinero } from '../utils/helpers.js'

export default function HistorialEntradas() {
  const {
    personas, categorias,
    getEntradasDia, getSalidasDia,
    getPreciosDia, getPagoPersonaDia, getTotalPagoDia,
  } = useApp()

  const [fecha, setFecha] = useState(hoy())

  const entradas     = getEntradasDia(fecha)
  const precios      = getPreciosDia(fecha)
  const totalPago    = getTotalPagoDia(fecha)
  const totalCajas   = entradas.reduce((a, e) => a + e.cantidad, 0)

  // Agrupar entradas por persona para mostrarlas juntas
  const porPersona = personas
    .map(p => {
      const entradasP  = entradas.filter(e => e.personaId === p.id)
      const salidasP   = getSalidasDia(fecha).filter(s => s.personaId === p.id)
      const cajasSalio = salidasP.reduce((a, s) => a + s.cantidad, 0)
      const cajasRegreso = entradasP.reduce((a, e) => a + e.cantidad, 0)
      const pago       = getPagoPersonaDia(p.id, fecha)
      return { persona: p, entradasP, cajasSalio, cajasRegreso, pago }
    })
    .filter(x => x.entradasP.length > 0 || x.cajasSalio > 0)

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

      {/* KPIs */}
      <div className="kpi-grid">
        <div className="kpi">
          <span className="kpi-label">Total cajas</span>
          <span className="kpi-valor verde">{totalCajas.toLocaleString()}</span>
        </div>
        <div className="kpi">
          <span className="kpi-label">Personas</span>
          <span className="kpi-valor azul">{porPersona.length}</span>
        </div>
      </div>

      {/* Total a pagar destacado */}
      {totalPago > 0 && (
        <div className="kpi-total">
          <div className="kpi-label">💰 Total a pagar</div>
          <div className="kpi-valor" style={{ fontSize: '2.2rem' }}>
            {formatDinero(totalPago)}
          </div>
        </div>
      )}

      {/* Desglose por persona */}
      {porPersona.length === 0 ? (
        <div className="card">
          <div className="vacío">
            <span className="vacío-icono">📭</span>
            No hay entradas registradas para este día
          </div>
        </div>
      ) : (
        porPersona.map(({ persona, entradasP, cajasSalio, cajasRegreso, pago }) => (
          <div key={persona.id} className="card">

            {/* Encabezado de persona */}
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: 12,
            }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1rem' }}>{persona.nombre}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--gris-5)', marginTop: 2 }}>
                  📤 Se llevó {cajasSalio.toLocaleString()} · 📥 Regresó {cajasRegreso.toLocaleString()}
                  {cajasSalio > cajasRegreso && (
                    <span style={{ color: 'var(--rojo)', marginLeft: 4 }}>
                      · ⚠️ Pendientes: {(cajasSalio - cajasRegreso).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
              {pago > 0 && (
                <span style={{
                  fontSize: '1.1rem', fontWeight: 900,
                  color: 'var(--verde)',
                }}>
                  {formatDinero(pago)}
                </span>
              )}
            </div>

            {/* Filas de entradas de esta persona */}
            {entradasP.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {entradasP.map(e => {
                  const precio   = precios[e.categoriaId] ?? 0
                  const subtotal = e.cantidad * precio
                  return (
                    <div key={e.id} style={{
                      display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center',
                      background: 'var(--gris-2)',
                      borderRadius: 'var(--radio-sm)',
                      padding: '8px 12px',
                    }}>
                      <div>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                          {getNombre(categorias, e.categoriaId)}
                        </span>
                        {precio > 0 && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--gris-5)', marginLeft: 6 }}>
                            {formatDinero(precio)} c/u
                          </span>
                        )}
                        {e.nota && (
                          <div style={{ fontSize: '0.72rem', color: 'var(--gris-4)', marginTop: 2 }}>
                            📝 {e.nota}
                          </div>
                        )}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 700 }}>
                          {e.cantidad.toLocaleString()} cajas
                        </div>
                        {subtotal > 0 && (
                          <div style={{ fontSize: '0.82rem', color: 'var(--verde)', fontWeight: 700 }}>
                            {formatDinero(subtotal)}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div style={{ fontSize: '0.82rem', color: 'var(--gris-4)', fontStyle: 'italic' }}>
                Sin entradas registradas — solo salidas
              </div>
            )}

          </div>
        ))
      )}

      {/* Resumen final de categorías */}
      {entradas.length > 0 && (
        <div className="card">
          <div className="kpi-label" style={{ marginBottom: 12 }}>
            📊 Resumen por categoría
          </div>
          {categorias
            .map(cat => {
              const total = entradas
                .filter(e => e.categoriaId === cat.id)
                .reduce((a, e) => a + e.cantidad, 0)
              const precio   = precios[cat.id] ?? 0
              const subtotal = total * precio
              return { cat, total, subtotal }
            })
            .filter(x => x.total > 0)
            .map(({ cat, total, subtotal }) => (
              <div key={cat.id} style={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 0',
                borderBottom: '1px solid var(--gris-3)',
              }}>
                <div>
                  <span style={{ fontWeight: 700 }}>{cat.nombre}</span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--gris-5)', marginLeft: 6 }}>
                    {total.toLocaleString()} cajas
                  </span>
                </div>
                {subtotal > 0 && (
                  <span style={{ fontWeight: 800, color: 'var(--verde)' }}>
                    {formatDinero(subtotal)}
                  </span>
                )}
              </div>
            ))
          }
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            paddingTop: 10, fontWeight: 800,
          }}>
            <span>Total</span>
            <span className="text-verde">{formatDinero(totalPago)}</span>
          </div>
        </div>
      )}

    </div>
  )
}
