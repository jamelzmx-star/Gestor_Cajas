import React, { useState } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { useToast } from '../components/Toast.jsx'
import { manana, fechaLegible, getNombre } from '../utils/helpers.js'
import Modal from '../components/Modal.jsx'

export default function Planeacion() {
  const {
    personas, planeacion,
    addPlaneacion, editPlaneacion, deletePlaneacion,
    inventario, getTotalSalidas, getTotalEntradas,
  } = useApp()
  const toast = useToast()

  // La planeación es para mañana
  const fecha = manana()

  const registros    = planeacion.filter(p => p.fecha === fecha)
  const totalApartado = registros.reduce((a, p) => a + p.cantidad, 0)

  // Inventario estimado de mañana: inventario actual de hoy
  const [invEstimado, setInvEstimado] = useState('')
  const invNum = invEstimado !== '' ? Number(invEstimado) : null

  const diferencia  = invNum != null ? invNum - totalApartado : null
  const alcanza     = diferencia == null || diferencia >= 0

  const [personaId,  setPersonaId]  = useState('')
  const [cantidad,   setCantidad]   = useState('')
  const [nota,       setNota]       = useState('')
  const [editando,   setEditando]   = useState(null)
  const [modalEdit,  setModalEdit]  = useState(false)
  const [confirmId,  setConfirmId]  = useState(null)

  function guardar() {
    if (!personaId)  return toast('Selecciona una persona', 'error')
    if (!cantidad || Number(cantidad) <= 0)
                     return toast('Ingresa una cantidad válida', 'error')
    addPlaneacion(fecha, personaId, cantidad, nota)
    setCantidad('')
    setNota('')
    toast('Apartado registrado ✔', 'exito')
  }

  function guardarEdicion() {
    if (!editando.cantidad || isNaN(editando.cantidad))
      return toast('Cantidad inválida', 'error')
    editPlaneacion(editando.id, {
      cantidad: Number(editando.cantidad),
      nota: editando.nota,
    })
    setModalEdit(false)
    toast('Registro actualizado', 'exito')
  }

  function eliminar() {
    deletePlaneacion(confirmId)
    setConfirmId(null)
    toast('Apartado eliminado', 'aviso')
  }

  return (
    <div className="pagina">

      <div className="alerta alerta-info">
        📅 Planeación para: <strong>{fechaLegible(fecha)}</strong>
      </div>

      {/* Inventario estimado */}
      <div className="card">
        <div className="kpi-label" style={{ marginBottom: 8 }}>
          📦 Inventario estimado para mañana
        </div>
        <input
          className="form-input"
          type="number"
          placeholder="¿Cuántas cajas tendrás disponibles?"
          value={invEstimado}
          onChange={e => setInvEstimado(e.target.value)}
        />
      </div>

      {/* Estado */}
      {invNum != null && (
        <div className={`planeacion-estado ${alcanza ? 'ok' : 'malo'}`}>
          <div className="planeacion-estado-texto">
            {alcanza
              ? `✅ Alcanza — sobran ${diferencia.toLocaleString()} cajas`
              : `❌ No alcanza — faltan ${Math.abs(diferencia).toLocaleString()} cajas`
            }
          </div>
          <div className="planeacion-estado-sub">
            Disponible: {invNum.toLocaleString()} | Apartado: {totalApartado.toLocaleString()}
          </div>
        </div>
      )}

      {/* Formulario */}
      <div className="card">
        <div className="kpi-label" style={{ marginBottom: 12 }}>➕ Nuevo apartado</div>

        {personas.length === 0 ? (
          <div className="alerta alerta-aviso">
            No hay personas. Ve a Más → Personas para agregar.
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

            <div className="form-group" style={{ marginBottom: 10 }}>
              <label className="form-label">Cantidad a apartar</label>
              <input
                className="form-input"
                type="number"
                placeholder="0"
                min="1"
                value={cantidad}
                onChange={e => setCantidad(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 12 }}>
              <label className="form-label">Nota (opcional)</label>
              <input
                className="form-input"
                placeholder="Ej: Urgente, temporada alta..."
                value={nota}
                onChange={e => setNota(e.target.value)}
              />
            </div>

            <button className="btn btn-primario btn-bloque" onClick={guardar}>
              📅 Agregar apartado
            </button>
          </>
        )}
      </div>

      {/* Lista de apartados */}
      <div className="card">
        <div className="kpi-label" style={{ marginBottom: 12 }}>
          📋 Apartados para mañana ({registros.length})
        </div>

        {registros.length === 0 ? (
          <div className="vacío">
            <span className="vacío-icono">📝</span>
            No hay apartados registrados
          </div>
        ) : (
          <div className="lista">
            {registros.map(r => (
              <div key={r.id} className="lista-item">
                <div className="lista-item-info">
                  <div className="lista-item-nombre">
                    {getNombre(personas, r.personaId)}
                  </div>
                  <div className="lista-item-sub">
                    {r.cantidad.toLocaleString()} cajas
                    {r.nota && <> — <em>{r.nota}</em></>}
                  </div>
                </div>
                <div className="lista-acciones">
                  <button
                    className="btn-icono"
                    onClick={() => { setEditando({ id: r.id, cantidad: r.cantidad, nota: r.nota }); setModalEdit(true) }}
                  >✏️</button>
                  <button className="btn-icono" onClick={() => setConfirmId(r.id)}>🗑️</button>
                </div>
              </div>
            ))}

            <div style={{
              display: 'flex', justifyContent: 'space-between',
              padding: '10px 0 0', borderTop: '2px solid var(--gris-3)',
              fontWeight: 800
            }}>
              <span>Total apartado:</span>
              <span className="text-azul">{totalApartado.toLocaleString()} cajas</span>
            </div>
          </div>
        )}
      </div>

      {/* Modal editar */}
      <Modal abierto={modalEdit} onCerrar={() => setModalEdit(false)} titulo="✏️ Editar apartado">
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
          <input
            className="form-input"
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
          ¿Eliminar este apartado?
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-gris" style={{ flex: 1 }} onClick={() => setConfirmId(null)}>Cancelar</button>
          <button className="btn btn-rojo" style={{ flex: 1 }} onClick={eliminar}>Eliminar</button>
        </div>
      </Modal>

    </div>
  )
}
