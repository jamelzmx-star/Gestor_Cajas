import React, { createContext, useContext, useState, useCallback } from 'react'

const ToastCtx = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const mostrar = useCallback((mensaje, tipo = 'exito') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, mensaje, tipo }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3000)
  }, [])

  const iconos = { exito: '✅', error: '❌', aviso: '⚠️' }

  return (
    <ToastCtx.Provider value={mostrar}>
      {children}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.tipo}`}>
            <span>{iconos[t.tipo]}</span>
            <span>{t.mensaje}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastCtx)
  if (!ctx) throw new Error('useToast debe usarse dentro de ToastProvider')
  return ctx
}
