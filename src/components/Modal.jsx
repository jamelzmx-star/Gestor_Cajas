import React, { useEffect } from 'react'

/**
 * Modal tipo "bottom sheet" (sube desde abajo)
 * Props:
 *   abierto   - bool
 *   onCerrar  - function
 *   titulo    - string
 *   children  - contenido del modal
 */
export default function Modal({ abierto, onCerrar, titulo, children }) {
  // Bloquear scroll del fondo cuando el modal está abierto
  useEffect(() => {
    if (abierto) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [abierto])

  if (!abierto) return null

  return (
    <div
      className="modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onCerrar() }}
    >
      <div className="modal-content">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span className="modal-titulo">{titulo}</span>
          <button
            className="btn-icono"
            onClick={onCerrar}
            style={{ fontSize: '1.3rem', color: 'var(--gris-5)' }}
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
