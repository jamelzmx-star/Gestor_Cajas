import React, { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { useToast } from '../components/Toast.jsx'
import { hoy, fechaLegible } from '../utils/helpers.js'

export default function Precios() {
  const { categorias, precios, setPreciosDia } = useApp()
  const toast = useToast()
  const fecha = hoy()

  const categoriasActivas = categorias.filter(c => c.activa)

  // Inicializar los valores con los precios existentes
  const [valores, setValores] = useState(() => {
    const preciosHoy = precios[fecha] ?? {}
    // Si no hay precios hoy, buscar los más recientes
    const todasFechas = Object.keys(precios).sort()
    const anterior = todasFechas.filter(f => f <= fecha).pop()
    const base = anterior ? precios[anterior] : {}
    return categoriasActivas.reduce((acc, cat) => ({
      ...acc,
      [cat.id]: preciosHoy[cat.id] ?? base[cat.id] ?? ''
    }), {})
  })

  function guardar() {
    const preciosNuevos = {}
    let valido = true

    categoriasActivas.forEach(cat => {
      const val = valores[cat.id]
      if (val !== '' && !isNaN(val) && Number(val) >= 0) {
        preciosNuevos[cat.id] = Number(val)
      } else if (val !== '') {
        valido = false
      }
    })

    if (!valido) return toast('Hay valores inválidos', 'error')

    setPreciosDia(fecha, preciosNuevos)
    toast('Precios guardados ✔', 'exito')
  }

  function copiarAyer() {
    const ayer = Object.keys(precios).sort().filter(f => f < fecha).pop()
    if (!ayer) return toast('No hay precios anteriores para copiar', 'error')
    const preciosAyer = precios[ayer]
    setValores(prev =>
      categoriasActivas.reduce((acc, cat) => ({
        ...acc,
        [cat.id]: preciosAyer[cat.id] ?? prev[cat.id] ?? ''
      }), {})
    )
    toast('Precios copiados ✔', 'exito')
  }

  return (
    <div className="pagina">

      <div className="alerta alerta-info">
        💲 Precios para: <strong>{fechaLegible(fecha)}</strong>
        <br/>
        <span style={{ fontSize: '0.8rem', opacity: 0.85 }}>
          Si no configuras precios hoy, se usan los del día anterior
        </span>
      </div>

      {categoriasActivas.length === 0 ? (
        <div className="alerta alerta-aviso">
          No hay categorías activas. Ve a Más → Categorías para agregar.
        </div>
      ) : (
        <>
          <div className="card">
            <div className="kpi-label" style={{ marginBottom: 12 }}>
              Precio por caja de cada categoría
            </div>

            <div className="precio-grid">
              {categoriasActivas.map(cat => (
                <div key={cat.id} className="precio-row">
                  <span className="precio-nombre">{cat.nombre}</span>
                  <span className="precio-simbolo">$</span>
                  <input
                    className="precio-input"
                    type="number"
                    min="0"
                    step="0.50"
                    placeholder="0.00"
                    value={valores[cat.id] ?? ''}
                    onChange={e => setValores(prev => ({ ...prev, [cat.id]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-gris" style={{ flex: 1 }} onClick={copiarAyer}>
              📋 Copiar de ayer
            </button>
            <button className="btn btn-verde" style={{ flex: 2 }} onClick={guardar}>
              💾 Guardar precios
            </button>
          </div>
        </>
      )}

      {/* Historial de precios */}
      {Object.keys(precios).length > 0 && (
        <div className="card">
          <div className="kpi-label" style={{ marginBottom: 12 }}>
            📅 Precios anteriores
          </div>
          {Object.keys(precios).sort().reverse().slice(0, 10).map(f => (
            <div key={f} style={{
              padding: '10px 0',
              borderBottom: '1px solid var(--gris-3)',
            }}>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: 6 }}>
                {fechaLegible(f)}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {categoriasActivas.map(cat => (
                  precios[f][cat.id] != null && (
                    <span key={cat.id} className="etiqueta etiqueta-verde">
                      {cat.nombre}: ${precios[f][cat.id]}
                    </span>
                  )
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  )
}
