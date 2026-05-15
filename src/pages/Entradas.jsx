import React, { useState } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { useToast } from '../components/Toast.jsx'
import { hoy, getNombre, formatDinero } from '../utils/helpers.js'
import Modal from '../components/Modal.jsx'

export default function Entradas() {
  const {
    personas, categorias,
    getSalidasDia, getEntradasDia,
    addEntrada, editEntrada, deleteEntrada,
    getPreciosDia,
  } = useApp()
  const toast = useToast()
  const fecha = hoy()

  const categoriasActivas = categorias.filter(c => c.activa)
  const precios           = getPreciosDia(fecha)

  const cantidadesInit = () =>
    categoriasActivas.reduce((acc, c) => ({ ...acc, [c.id]: '' }), {})

  const [personaId,  setPersonaId]  = useState('')
  const [cantidades, setCantidades] = useState(cantidadesInit())
  const [nota,       setNota]       = useState('')
  const [editando,   setEditando]   = useState(null)
  const [modalEdit,  setModalEdit]  = useState(false)
  const [confirmId,  setConfirmId]  = useState(null)

  const entradas = getEntradasDia(fecha)

  // ── Datos de la persona seleccionada ─────────────────
  const salidasPersona = personaId
    ? getSalidasDia(fecha).filter(s => s.personaId === personaId)
    : []
  const cajasSalieron = salidasPersona.reduce((a, s) => a + s.cantidad, 0)

  const entradasPersonaHoy = personaId
    ? entradas.filter(e => e.personaId === personaId)
    : []
  const cajasYaRegresaron = entradasPersonaHoy.reduce((a, e) => a + e.cantidad, 0)
  const cajasPendientes   = cajasSalieron - cajasYaRegresaron

  // Pago estimado con las cantidades actuales del formulario
  const pagoEstimado = categoriasActivas.reduce((acc, cat) => {
    const val    = Number(cantidades[cat.id]) || 0
    const precio = precios[cat.id] ?? 0
    return acc + val * precio
  }, 0)

  // ─────────────────────────────────────────────────────

  function guardar() {
    if (!personaId) return toast('Selecciona una persona', 'error')

    const registros = categoriasActivas.filter(c => {
      const v = cantidades[c.id]
      return v !== '' && !isNaN(v) && Number(v) > 0
    })

    if (registros.length === 0)
      return toast('Ingresa al menos una cantidad', 'error')

    registros.forEach(c => {
      addEntrada(fecha, personaId, c.id, cantidades[c.id], nota)
    })

    setCantidades(cantidadesInit())
    setNota('')
    toast(`${registros.length} registro(s) guardado(s) ✔`, 'exito')
  }

  function guardarEdicion() {
    if (!editando.cantidad || isNaN(editando.cantidad))
      return toast('Cantidad inválida', 'error')
    editEntrada(editando.id, { cantidad: Number(editando.cantidad), nota: editando.nota })
    setModalEdit(false)
    toast('Registro actualizado', 'exito')
  }

  function eliminar() {
    deleteEntrada(confirmId)
    setConfirmId(null)
    toast('Registro eliminado', 'aviso')
  }

  return (
    <div className="pagina">

      {/* Formulario */}
      <div className="card">
        <div className="kpi-label" style={{ marginBottom: 12 }}>➕ Registrar entrada</div>

        {personas.length === 0 ? (
          <div className="alerta alerta-aviso">
            No hay personas. Ve a Más → Personas para agregar.
          </div>
        ) : categoriasActivas.length === 0 ? (
          <div className="alerta alerta-aviso">
            No hay categorías activas. Ve a Más → Categorías.
          </div>
        ) : (
          <>
            {/* Selector de persona */}
            <div className="form-group" style={{ marginBottom: 12 }}>
              <label className="form-label">Persona</label>
              <select
                className="form-select"
                value={personaId}
                onChange={e => {
                  setPersonaId(e.target.value)
                  setCantidades(cantidadesInit())
                }}
              >
                <option value="">— Seleccionar —</option>
                {personas.map(p => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
            </div>

            {/* Resumen de cajas de esta persona */}
            {personaId && (
              <div style={{
                background: 'var(--gris-2)',
                borderRadius: 'var(--radio-sm)',
                padding: '12px 14px',
                marginBottom: 14,
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: 8,
                textAlign: 'center',
              }}>
                <div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--naranja)' }}>
                    {cajasSalieron.toLocaleString()}
                  </div>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--gris-5)', textTransform: 'uppercase' }}>
                    Se llevó
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--verde)' }}>
                    {cajasYaRegresaron.toLocaleString()}
                  </div>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--gris-5)', textTransform: 'uppercase' }}>
                    Ya regresó
                  </div>
                </div>
                <div>
                  <div style={{
                    fontSize: '1.3rem', fontWeight: 800,
                    color: cajasPendientes > 0 ? 'var(--rojo)' : 'var(--gris-4)',
                  }}>
                    {cajasPendientes.toLocaleString()}
                  </div>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--gris-5)', textTransform: 'uppercase' }}>
                    Pendientes
                  </div>
                </div>
              </div>
            )}

            {/* Sin precio configurado */}
            {personaId && Object.keys(precios).length === 0 && (
              <div className="alerta alerta-aviso" style={{ marginBottom: 12 }}>
                ⚠️ No hay precios configurados para hoy. Ve a Más → Precios del día.
              </div>
            )}

            {/* Cantidades por categoría */}
            <div className="kpi-label" style={{ marginBottom: 8 }}>Cantidad por categoría</div>

            {categoriasActivas.map(cat => {
              const precio    = precios[cat.id]
              const cant      = Number(cantidades[cat.id]) || 0
              const subtotal  = cant * (precio ?? 0)

              return (
                <div key={cat.id} style={{ marginBottom: 12 }}>
                  {/* Encabezado de la categoría */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    marginBottom: 5,
                  }}>
                    <label className="form-label" style={{ margin: 0 }}>
                      {cat.nombre}
                    </label>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      {precio != null ? (
                        <span style={{
                          fontSize: '0.78rem', fontWeight: 700,
                          background: 'var(--verde-bg)', color: 'var(--verde)',
                          padding: '2px 8px', borderRadius: 99,
                        }}>
                          {formatDinero(precio)} c/u
                        </span>
                      ) : (
                        <span style={{
                          fontSize: '0.75rem', color: 'var(--gris-4)',
                          background: 'var(--gris-2)', padding: '2px 8px', borderRadius: 99,
                        }}>
                          sin precio
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Input + subtotal */}
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input
                      className="form-input"
                      type="number"
                      placeholder="0"
                      min="0"
                      value={cantidades[cat.id] ?? ''}
                      onChange={e => setCantidades(prev => ({ ...prev, [cat.id]: e.target.value }))}
                      style={{ flex: 1 }}
                    />
                    {/* Subtotal de esta categoría */}
                    {cant > 0 && precio != null && (
                      <span style={{
                        fontSize: '0.9rem', fontWeight: 800,
                        color: 'var(--verde)', minWidth: 72, textAlign: 'right',
                      }}>
                        {formatDinero(subtotal)}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}

            {/* Pago estimado total */}
            {personaId && pagoEstimado > 0 && (
              <div style={{
                background: 'var(--verde-bg)',
                border: '2px solid var(--verde)',
                borderRadius: 'var(--radio-sm)',
                padding: '10px 14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 12,
              }}>
                <span style={{ fontWeight: 700, color: 'var(--verde)' }}>
                  💰 Pago estimado
                </span>
                <span style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--verde)' }}>
                  {formatDinero(pagoEstimado)}
                </span>
              </div>
            )}

            <div className="form-group" style={{ marginBottom: 12 }}>
              <label className="form-label">Nota (opcional)</label>
              <textarea
                className="form-textarea"
                placeholder="Observaciones..."
                value={nota}
                onChange={e => setNota(e.target.value)}
              />
            </div>

            <button className="btn btn-verde btn-bloque" onClick={guardar}>
              📥 Registrar entrada
            </button>
          </>
        )}
      </div>

      {/* Lista de entradas */}
      <div className="card">
        <div className="kpi-label" style={{ marginBottom: 12 }}>
          📋 Entradas de hoy ({entradas.length})
        </div>

        {entradas.length === 0 ? (
          <div className="vacío">
            <span className="vacío-icono">📭</span>
            Aún no hay entradas registradas hoy
          </div>
        ) : (
          <div className="lista">
            {entradas.map(e => {
              const precio = precios[e.categoriaId] ?? 0
              return (
                <div key={e.id} className="lista-item">
                  <div className="lista-item-info">
                    <div className="lista-item-nombre">
                      {getNombre(personas, e.personaId)}
                    </div>
                    <div className="lista-item-sub">
                      {getNombre(categorias, e.categoriaId)} — {e.cantidad} cajas
                      {precio > 0 && (
                        <span style={{ marginLeft: 6, color: 'var(--verde)', fontWeight: 700 }}>
                          = {formatDinero(e.cantidad * precio)}
                        </span>
                      )}
                    </div>
                    {e.nota && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--gris-4)', marginTop: 2 }}>
                        📝 {e.nota}
                      </div>
                    )}
                  </div>
                  <div className="lista-acciones">
                    <button className="btn-icono" onClick={() => { setEditando({ id: e.id, cantidad: e.cantidad, nota: e.nota }); setModalEdit(true) }}>✏️</button>
                    <button className="btn-icono" onClick={() => setConfirmId(e.id)}>🗑️</button>
                  </div>
                </div>
              )
            })}

            <div style={{
              display: 'flex', justifyContent: 'space-between',
              padding: '10px 0 0', borderTop: '2px solid var(--gris-3)', fontWeight: 800,
            }}>
              <span>Total cajas:</span>
              <span className="text-verde">
                {entradas.reduce((a, e) => a + e.cantidad, 0).toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Modal editar */}
      <Modal abierto={modalEdit} onCerrar={() => setModalEdit(false)} titulo="✏️ Editar entrada">
        <div className="form-group">
          <label className="form-label">Cantidad</label>
          <input
            className="form-input"
            type="number"
            value={editando?.cantidad ?? ''}
            onChange={e => setEditando(p => ({ ...p, cantidad: e.target.value }))}
            autoFocus
          />
        </div>
        <div className="form-group">
          <label className="form-label">Nota</label>
          <textarea
            className="form-textarea"
            value={editando?.nota ?? ''}
            onChange={e => setEditando(p => ({ ...p, nota: e.target.value }))}
          />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-gris" style={{ flex: 1 }} onClick={() => setModalEdit(false)}>Cancelar</button>
          <button className="btn btn-primario" style={{ flex: 1 }} onClick={guardarEdicion}>Guardar</button>
        </div>
      </Modal>

      {/* Modal confirmar */}
      <Modal abierto={confirmId !== null} onCerrar={() => setConfirmId(null)} titulo="⚠️ Eliminar">
        <p style={{ color: 'var(--gris-6)', lineHeight: 1.5 }}>
          ¿Eliminar este registro? No se puede deshacer.
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-gris" style={{ flex: 1 }} onClick={() => setConfirmId(null)}>Cancelar</button>
          <button className="btn btn-rojo" style={{ flex: 1 }} onClick={eliminar}>Eliminar</button>
        </div>
      </Modal>

    </div>
  )
}
