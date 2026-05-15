import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { useToast } from '../components/Toast.jsx'
import { hoy, formatDinero } from '../utils/helpers.js'
import Modal from '../components/Modal.jsx'

export default function Personas() {
  const { personas, addPersona, deletePersona, getPagoPersonaDia, getHistorialPersona } = useApp()
  const toast    = useToast()
  const navigate = useNavigate()
  const fecha    = hoy()

  const [nombre,    setNombre]    = useState('')
  const [busqueda,  setBusqueda]  = useState('')
  const [confirmId, setConfirmId] = useState(null)
  const [modalAdd,  setModalAdd]  = useState(false)

  const filtradas = personas.filter(p =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase())
  )

  function guardar() {
    const n = nombre.trim()
    if (!n) return toast('Escribe un nombre', 'error')
    if (personas.some(p => p.nombre.toLowerCase() === n.toLowerCase()))
      return toast('Ya existe una persona con ese nombre', 'error')
    addPersona(n)
    setNombre('')
    setModalAdd(false)
    toast(`${n} agregado ✔`, 'exito')
  }

  function eliminar() {
    deletePersona(confirmId)
    setConfirmId(null)
    toast('Persona eliminada', 'aviso')
  }

  return (
    <div className="pagina">

      {/* Buscador */}
      <div className="buscador">
        <span className="buscador-icono">🔍</span>
        <input
          className="form-input"
          placeholder="Buscar persona..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
        />
      </div>

      {/* Botón agregar */}
      <button className="btn btn-primario btn-bloque" onClick={() => setModalAdd(true)}>
        ➕ Nueva persona
      </button>

      {/* Lista */}
      {filtradas.length === 0 ? (
        <div className="vacío">
          <span className="vacío-icono">👥</span>
          {personas.length === 0
            ? 'Aún no hay personas. ¡Agrega la primera!'
            : 'Nadie coincide con la búsqueda'}
        </div>
      ) : (
        <div className="lista">
          {filtradas.map(p => {
            const pagoHoy     = getPagoPersonaDia(p.id, fecha)
            const historial   = getHistorialPersona(p.id)
            const diasTrabajados = historial.length
            const totalMes    = historial
              .filter(h => h.fecha.startsWith(fecha.slice(0, 7)))
              .reduce((a, h) => a + h.pago, 0)

            return (
              <div key={p.id} className="lista-item">
                <div
                  className="lista-item-info"
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/historial/${p.id}`)}
                >
                  <div className="lista-item-nombre">{p.nombre}</div>
                  <div className="lista-item-sub">
                    Hoy: <strong style={{ color: 'var(--verde)' }}>{formatDinero(pagoHoy)}</strong>
                    {' · '}
                    Este mes: <strong>{formatDinero(totalMes)}</strong>
                    {' · '}
                    {diasTrabajados} días trabajados
                  </div>
                </div>
                <div className="lista-acciones">
                  <button
                    className="btn btn-gris btn-sm"
                    onClick={() => navigate(`/historial/${p.id}`)}
                  >
                    Historial
                  </button>
                  <button
                    className="btn-icono"
                    onClick={() => setConfirmId(p.id)}
                    title="Eliminar"
                  >🗑️</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal nueva persona */}
      <Modal abierto={modalAdd} onCerrar={() => setModalAdd(false)} titulo="➕ Nueva persona">
        <div className="form-group">
          <label className="form-label">Nombre</label>
          <input
            className="form-input"
            placeholder="Nombre completo"
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

      {/* Modal confirmar eliminar */}
      <Modal abierto={confirmId !== null} onCerrar={() => setConfirmId(null)} titulo="⚠️ Eliminar persona">
        <p style={{ color: 'var(--gris-6)', lineHeight: 1.6 }}>
          ¿Estás seguro? Se eliminará a{' '}
          <strong>{personas.find(p => p.id === confirmId)?.nombre}</strong>.
          <br/>
          <span style={{ color: 'var(--rojo)', fontSize: '0.85rem' }}>
            Los registros de salidas y entradas de esa persona permanecerán,
            pero ya no aparecerá en el sistema.
          </span>
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-gris" style={{ flex: 1 }} onClick={() => setConfirmId(null)}>
            Cancelar
          </button>
          <button className="btn btn-rojo" style={{ flex: 1 }} onClick={eliminar}>
            Eliminar
          </button>
        </div>
      </Modal>

    </div>
  )
}
