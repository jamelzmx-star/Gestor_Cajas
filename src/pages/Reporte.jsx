import React, { useState } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { useNavigate } from 'react-router-dom'
import { hoy, fechaLegible, formatDinero, fechaISO } from '../utils/helpers.js'

export default function Reporte() {
  const {
    personas, categorias,
    getSalidasDia, getEntradasDia,
    getPreciosDia, getPagoPersonaDia, getTotalPagoDia,
    inventario, getTotalSalidas, getTotalEntradas,
    getInventarioActual,
  } = useApp()

  const navigate = useNavigate()

  // Permitir ver el reporte de otras fechas
  const [fecha, setFecha] = useState(hoy())

  const salidas      = getSalidasDia(fecha)
  const entradas     = getEntradasDia(fecha)
  const precios      = getPreciosDia(fecha)
  const totalPago    = getTotalPagoDia(fecha)
  const invInicial   = inventario[fecha] ?? 0
  const totalSalidas = getTotalSalidas(fecha)
  const totalEntradas= getTotalEntradas(fecha)
  const invActual    = getInventarioActual(fecha)

  // Construir filas por persona
  const filas = personas.map(p => {
    const salidaPersona = salidas.filter(s => s.personaId === p.id)
    const entradasPersona = entradas.filter(e => e.personaId === p.id)
    const totalEntregadas = salidaPersona.reduce((a, s) => a + s.cantidad, 0)

    // Totales por categoría
    const porCategoria = categorias.reduce((acc, cat) => {
      const total = entradasPersona
        .filter(e => e.categoriaId === cat.id)
        .reduce((a, e) => a + e.cantidad, 0)
      return { ...acc, [cat.id]: total }
    }, {})

    const pago = getPagoPersonaDia(p.id, fecha)

    return { persona: p, totalEntregadas, porCategoria, pago }
  }).filter(f => f.totalEntregadas > 0 || Object.values(f.porCategoria).some(v => v > 0))

  // Totales columna
  const totalEntregadasGlobal = filas.reduce((a, f) => a + f.totalEntregadas, 0)

  return (
    <div className="pagina">

      {/* Selector de fecha */}
      <div className="card">
        <div className="kpi-label" style={{ marginBottom: 8 }}>📅 Fecha del reporte</div>
        <input
          type="date"
          className="form-input"
          value={fecha}
          max={hoy()}
          onChange={e => setFecha(e.target.value)}
        />
        <div style={{ marginTop: 8, fontSize: '0.85rem', color: 'var(--gris-5)' }}>
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
          <span className="kpi-label">Salidas</span>
          <span className="kpi-valor naranja">{totalSalidas.toLocaleString()}</span>
        </div>
        <div className="kpi">
          <span className="kpi-label">Entradas</span>
          <span className="kpi-valor verde">{totalEntradas.toLocaleString()}</span>
        </div>
        <div className="kpi">
          <span className="kpi-label">Inv. final</span>
          <span className={`kpi-valor ${invActual < 0 ? 'rojo' : ''}`}>
            {invActual.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Total a pagar */}
      <div className="kpi-total">
        <div className="kpi-label">💰 Total a pagar</div>
        <div className="kpi-valor" style={{ fontSize: '2.4rem' }}>
          {formatDinero(totalPago)}
        </div>
      </div>

      {/* Tabla de personas */}
      <div className="card">
        <div className="kpi-label" style={{ marginBottom: 12 }}>👥 Desglose por persona</div>

        {filas.length === 0 ? (
          <div className="vacío">
            <span className="vacío-icono">📋</span>
            No hay registros para esta fecha
          </div>
        ) : (
          <>
            <div className="tabla-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Persona</th>
                    <th className="td-numero">Entregadas</th>
                    {categorias.map(cat => (
                      <th key={cat.id} className="td-numero">{cat.nombre}</th>
                    ))}
                    <th className="td-numero">Pago</th>
                  </tr>
                </thead>
                <tbody>
                  {filas.map(f => (
                    <tr
                      key={f.persona.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/historial/${f.persona.id}`)}
                    >
                      <td style={{ fontWeight: 600 }}>
                        {f.persona.nombre}
                      </td>
                      <td className="td-numero">{f.totalEntregadas.toLocaleString()}</td>
                      {categorias.map(cat => (
                        <td key={cat.id} className="td-numero">
                          {f.porCategoria[cat.id] > 0
                            ? f.porCategoria[cat.id].toLocaleString()
                            : <span style={{ color: 'var(--gris-4)' }}>—</span>
                          }
                        </td>
                      ))}
                      <td className="td-pago">{formatDinero(f.pago)}</td>
                    </tr>
                  ))}
                  {/* Fila de totales */}
                  <tr className="tabla-total">
                    <td style={{ fontWeight: 800 }}>TOTAL</td>
                    <td className="td-numero">{totalEntregadasGlobal.toLocaleString()}</td>
                    {categorias.map(cat => {
                      const total = filas.reduce((a, f) => a + (f.porCategoria[cat.id] ?? 0), 0)
                      return (
                        <td key={cat.id} className="td-numero">{total.toLocaleString()}</td>
                      )
                    })}
                    <td className="td-pago">{formatDinero(totalPago)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: 8, fontSize: '0.75rem', color: 'var(--gris-4)' }}>
              Toca una fila para ver el historial de esa persona
            </div>
          </>
        )}
      </div>

      {/* Precios del día */}
      {Object.keys(precios).length > 0 && (
        <div className="card">
          <div className="kpi-label" style={{ marginBottom: 12 }}>💲 Precios aplicados</div>
          {categorias.map(cat => (
            precios[cat.id] != null && (
              <div key={cat.id} style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '6px 0', borderBottom: '1px solid var(--gris-3)'
              }}>
                <span>{cat.nombre}</span>
                <span style={{ fontWeight: 700, color: 'var(--verde)' }}>
                  {formatDinero(precios[cat.id])}
                </span>
              </div>
            )
          ))}
        </div>
      )}

    </div>
  )
}
