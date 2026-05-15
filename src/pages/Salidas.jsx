import React, { useState } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { useToast } from '../components/Toast.jsx'
import { hoy, getNombre } from '../utils/helpers.js'
import Modal from '../components/Modal.jsx'

export default function Salidas() {
  const {
    personas, getSalidasDia, addSalida, editSalida, deleteSalida,
    inventario, getTotalSalidas, getTotalEntradas,
  } = useApp()
  const toast = useToast()
  const fecha = hoy()

  const [personaId, setPersonaId] = useState('')
  const [cantidad,  setCantidad]  = useState('')
  const [editando,  setEditando]  = useState(null)
  const [modalEdit, setModalEdit] = useState(false)
  const [confirmId, setConfirmId] = useState(null)

  const salidas      = getSalidasDia(fecha)
  const totalSalidas = salidas.reduce((a, s) => a + s.cantidad, 0)
  const invInicial   = inventario[fecha] ?? 0
  const enCampo      = totalSalidas - getTotalEntradas(fecha)
  const disponible   = invInicial - totalSalidas   // cuánto queda por repartir

  function guardar() {
    if (!personaId)
      return toast('Selecciona una persona', 'error')

    const cant = Number(cantidad)
    if (!cantidad || isNaN(cant) || cant <= 0)
      return toast('Ingresa una cantidad válida', 'error')

    // ── Validación de inventario ──────────────────────────
    if (invInicial === 0)
      return toast('Primero registra el inventario inicial en el Dashboard', 'aviso')

    if (cant > disponible)
      return toast(
        `No hay suficiente inventario. Disponible: ${disponible.toLocaleString()} cajas`,
        'error'
      )
    // ─────────────────────────────────────────────────────

    addSalida(fecha, personaId, cant)
    setCantidad('')
    toast('Salida registrada ✔', 'exito')
  }

  function guardarEdicion() {
    const cant = Number(editando.cantidad)
    if (!editando.cantidad || isNaN(cant))
      return toast('Cantidad inválida', 'error')

    // Al editar: recalcular disponible devolviendo lo que tenía ese registro
    const salidaActual = salidas.find(s => s.id === editando.id)
    const disponibleEdicion = disponible + (salidaActual?.cantidad ?? 0)

    if (cant > disponibleEdicion)
      return toast(
        `Supera el inventario. Máximo para este registro: ${disponibleEdicion.toLocaleString()}`,
        'error'
      )

    editSalida(editando.id, { cantidad: cant })
    setModalEdit(false)
    toast('Registro actualizado', 'exito')
  }

  function eliminar() {
    deleteSalida(confirmId)
    setConfirmId(null)
    toast('Registro eliminado', 'aviso')
  }

  const colorDisponible = disponible <= 0 ? 'rojo' : disponible < invInicial * 0.2 ? 'naranja' : 'verde'

  return (
    <div className="pagina">

      {/* Resumen rápido */}
      <div className="kpi-grid">
        <div className="kpi">
          <span className="kpi-label">Inventario inicial</span>
          <span className="kpi-valor azul">{invInicial.toLocaleString()}</span>
        </div>
        <div className="kpi">
          <span className="kpi-label">Ya salieron</span>
          <span className="kpi-valor naranja">{totalSalidas.toLocaleString()}</span>
        </div>
        <div className="kpi">
          <span className="kpi-label">Disponible</span>
          <span className={`kpi-valor ${colorDisponible}`}>{disponible.toLocaleString()}</span>
          <span className="kpi-sub">Para seguir entregando</span>
        </div>
        <div className="kpi">
          <span className="kpi-label">En campo</span>
          <span className="kpi-valor">{enCampo.toLocaleString()}</span>
          <span className="kpi-sub">Sin regresar</span>
        </div>
      </div>

      {/* Alertas */}
      {invInicial === 0 && (
        <div className="alerta alerta-aviso">
          ⚠️ No hay inventario inicial. Regresa al Dashboard y regístralo primero.
        </div>
      )}
      {invInicial > 0 && disponible <= 0 && (
        <div className="alerta alerta-error">
          🚫 Inventario agotado — no puedes registrar más salidas hoy
        </div>
      )}

      {/* Formulario */}
      <div className="card">
        <div className="kpi-label" style={{ marginBottom: 12 }}>➕ Nueva salida</div>

        {personas.length === 0 ? (
          <div className="alerta alerta-aviso">
            No hay personas registradas. Ve a Más → Personas para agregar.
          </div>
        ) : (
          <>
            <div className="form-group" style={{ marginBottom: 10 }}>
              <label className="form-label">Persona</label>
              <select
                className="form-select"
                value={personaId}
                onChange={e => setPersonaId(e.target.value)}
              >
                <option value="">— Seleccionar —</option>
                {personas.map(p => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 6 }}>
              <label className="form-label">Cajas a entregar</label>
              <input
                className="form-input"
                type="number"
                placeholder="0"
                min="1"
                max={disponible}
                value={cantidad}
                onChange={e => setCantidad(e.target.value)}
              />
            </div>

            {disponible > 0 && (
              <div style={{ fontSize: '0.78rem', color: 'var(--gris-5)', marginBottom: 12, paddingLeft: 2 }}>
                Máximo disponible:{' '}
                <strong style={{ color: `var(--${colorDisponible})` }}>
                  {disponible.toLocaleString()} cajas
                </strong>
              </div>
            )}

            <button
              className="btn btn-naranja btn-bloque"
              onClick={guardar}
              disabled={invInicial === 0 || disponible <= 0}
            >
              📤 Registrar salida
            </button>
          </>
        )}
      </div>

      {/* Lista de salidas */}
      <div className="card">
        <div className="kpi-label" style={{ marginBottom: 12 }}>
          📋 Salidas de hoy ({salidas.length})
        </div>

        {salidas.length === 0 ? (
          <div className="vacío">
            <span className="vacío-icono">📭</span>
            Aún no hay salidas registradas hoy
          </div>
        ) : (
          <div className="lista">
            {salidas.map(s => (
              <div key={s.id} className="lista-item">
                <div className="lista-item-info">
                  <div className="lista-item-nombre">{getNombre(personas, s.personaId)}</div>
                  <div className="lista-item-sub">{s.cantidad.toLocaleString()} cajas entregadas</div>
                </div>
                <div className="lista-acciones">
                  <button className="btn-icono" onClick={() => { setEditando({ id: s.id, cantidad: s.cantidad }); setModalEdit(true) }}>✏️</button>
                  <button className="btn-icono" onClick={() => setConfirmId(s.id)}>🗑️</button>
                </div>
              </div>
            ))}

            <div style={{
              display: 'flex', justifyContent: 'space-between',
              padding: '10px 0 0', borderTop: '2px solid var(--gris-3)', fontWeight: 800,
            }}>
              <span>Total entregado:</span>
              <span className="text-naranja">{totalSalidas.toLocaleString()} cajas</span>
            </div>
          </div>
        )}
      </div>

      {/* Modal editar */}
      <Modal abierto={modalEdit} onCerrar={() => setModalEdit(false)} titulo="✏️ Editar salida">
        <div className="form-group">
          <label className="form-label">Cantidad de cajas</label>
          <input
            className="form-input"
            type="number"
            value={editando?.cantidad ?? ''}
            onChange={e => setEditando(p => ({ ...p, cantidad: e.target.value }))}
            autoFocus
          />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-gris" style={{ flex: 1 }} onClick={() => setModalEdit(false)}>Cancelar</button>
          <button className="btn btn-primario" style={{ flex: 1 }} onClick={guardarEdicion}>Guardar</button>
        </div>
      </Modal>

      {/* Modal confirmar */}
      <Modal abierto={confirmId !== null} onCerrar={() => setConfirmId(null)} titulo="⚠️ Eliminar registro">
        <p style={{ color: 'var(--gris-6)', lineHeight: 1.5 }}>
          ¿Estás seguro de que quieres eliminar esta salida?
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-gris" style={{ flex: 1 }} onClick={() => setConfirmId(null)}>Cancelar</button>
          <button className="btn btn-rojo" style={{ flex: 1 }} onClick={eliminar}>Eliminar</button>
        </div>
      </Modal>

    </div>
  )
}
