import React, { useState } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { useToast } from '../components/Toast.jsx'
import Modal from '../components/Modal.jsx'

export default function Categorias() {
  const { categorias, addCategoria, toggleCategoria, deleteCategoria } = useApp()
  const toast = useToast()

  const [nombre,    setNombre]    = useState('')
  const [modalAdd,  setModalAdd]  = useState(false)
  const [confirmId, setConfirmId] = useState(null)

  function guardar() {
    const n = nombre.trim()
    if (!n) return toast('Escribe un nombre', 'error')
    if (categorias.some(c => c.nombre.toLowerCase() === n.toLowerCase()))
      return toast('Ya existe esa categoría', 'error')
    addCategoria(n)
    setNombre('')
    setModalAdd(false)
    toast(`Categoría "${n}" creada ✔`, 'exito')
  }

  function eliminar() {
    deleteCategoria(confirmId)
    setConfirmId(null)
    toast('Categoría eliminada', 'aviso')
  }

  return (
    <div className="pagina">

      <div className="alerta alerta-info">
        💡 Las categorías activas aparecen en el formulario de Entradas
      </div>

      {/* Botón agregar */}
      <button className="btn btn-primario btn-bloque" onClick={() => setModalAdd(true)}>
        ➕ Nueva categoría
      </button>

      {/* Lista */}
      <div className="card">
        <div className="kpi-label" style={{ marginBottom: 12 }}>
          🗂️ Categorías ({categorias.length})
        </div>

        {categorias.length === 0 ? (
          <div className="vacío">
            <span className="vacío-icono">🗂️</span>
            Aún no hay categorías. ¡Agrega la primera!
          </div>
        ) : (
          categorias.map(cat => (
            <div key={cat.id} className="toggle-row">
              <div>
                <div className="toggle-nombre">{cat.nombre}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--gris-4)', marginTop: 2 }}>
                  {cat.activa ? '✅ Activa — aparece en entradas' : '⛔ Inactiva — oculta'}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <label className="toggle" title={cat.activa ? 'Desactivar' : 'Activar'}>
                  <input
                    type="checkbox"
                    checked={cat.activa}
                    onChange={() => toggleCategoria(cat.id)}
                  />
                  <span className="toggle-slider" />
                </label>
                <button
                  className="btn-icono"
                  onClick={() => setConfirmId(cat.id)}
                  title="Eliminar categoría"
                >🗑️</button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal nueva categoría */}
      <Modal abierto={modalAdd} onCerrar={() => setModalAdd(false)} titulo="➕ Nueva categoría">
        <div className="form-group">
          <label className="form-label">Nombre de la categoría</label>
          <input
            className="form-input"
            placeholder="Ej: Buena, Grande, Revuelta..."
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && guardar()}
            autoFocus
          />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-gris" style={{ flex: 1 }} onClick={() => setModalAdd(false)}>
            Cancelar
          </button>
          <button className="btn btn-primario" style={{ flex: 1 }} onClick={guardar}>
            Guardar
          </button>
        </div>
      </Modal>

      {/* Modal confirmar */}
      <Modal abierto={confirmId !== null} onCerrar={() => setConfirmId(null)} titulo="⚠️ Eliminar categoría">
        <p style={{ color: 'var(--gris-6)', lineHeight: 1.6 }}>
          ¿Eliminar la categoría{' '}
          <strong>{categorias.find(c => c.id === confirmId)?.nombre}</strong>?
          <br />
          <span style={{ color: 'var(--rojo)', fontSize: '0.85rem' }}>
            Los registros de entradas que usaban esta categoría
            mostrarán "(eliminado)" pero los datos no se borran.
          </span>
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-gris" style={{ flex: 1 }} onClick={() => setConfirmId(null)}>Cancelar</button>
          <button className="btn btn-rojo" style={{ flex: 1 }} onClick={eliminar}>Eliminar</button>
        </div>
      </Modal>

    </div>
  )
}
