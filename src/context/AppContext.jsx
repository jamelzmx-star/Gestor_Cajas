import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react'

// ─────────────────────────────────────────────
// CONTEXTO
// ─────────────────────────────────────────────
const AppContext = createContext(null)

// ─────────────────────────────────────────────
// ESTADO INICIAL
// ─────────────────────────────────────────────
const estadoVacio = {
  personas:    [],
  categorias:  [],
  precios:     {},
  salidas:     [],
  entradas:    [],
  inventario:  {},
  planeacion:  [],
  notas:       {},
}

// ─────────────────────────────────────────────
// REDUCER
// ─────────────────────────────────────────────
function reducer(state, action) {
  switch (action.type) {

    // PERSONAS
    case 'ADD_PERSONA':
      return { ...state, personas: [...state.personas, action.payload] }
    case 'DELETE_PERSONA':
      return { ...state, personas: state.personas.filter(p => p.id !== action.payload) }

    // CATEGORIAS
    case 'ADD_CATEGORIA':
      return { ...state, categorias: [...state.categorias, action.payload] }
    case 'TOGGLE_CATEGORIA':
      return {
        ...state,
        categorias: state.categorias.map(c =>
          c.id === action.payload ? { ...c, activa: !c.activa } : c
        )
      }
    case 'DELETE_CATEGORIA':
      return { ...state, categorias: state.categorias.filter(c => c.id !== action.payload) }

    // PRECIOS
    case 'SET_PRECIOS_DIA':
      return {
        ...state,
        precios: { ...state.precios, [action.fecha]: action.precios }
      }

    // SALIDAS
    case 'ADD_SALIDA':
      return { ...state, salidas: [...state.salidas, action.payload] }
    case 'EDIT_SALIDA':
      return {
        ...state,
        salidas: state.salidas.map(s =>
          s.id === action.payload.id ? { ...s, ...action.payload.data } : s
        )
      }
    case 'DELETE_SALIDA':
      return { ...state, salidas: state.salidas.filter(s => s.id !== action.payload) }

    // ENTRADAS
    case 'ADD_ENTRADA':
      return { ...state, entradas: [...state.entradas, action.payload] }
    case 'EDIT_ENTRADA':
      return {
        ...state,
        entradas: state.entradas.map(e =>
          e.id === action.payload.id ? { ...e, ...action.payload.data } : e
        )
      }
    case 'DELETE_ENTRADA':
      return { ...state, entradas: state.entradas.filter(e => e.id !== action.payload) }

    // INVENTARIO INICIAL
    case 'SET_INVENTARIO':
      return {
        ...state,
        inventario: { ...state.inventario, [action.fecha]: action.cantidad }
      }

    // PLANEACIÓN
    case 'ADD_PLANEACION':
      return { ...state, planeacion: [...state.planeacion, action.payload] }
    case 'EDIT_PLANEACION':
      return {
        ...state,
        planeacion: state.planeacion.map(p =>
          p.id === action.payload.id ? { ...p, ...action.payload.data } : p
        )
      }
    case 'DELETE_PLANEACION':
      return { ...state, planeacion: state.planeacion.filter(p => p.id !== action.payload) }

    // NOTAS
    case 'SET_NOTA':
      return {
        ...state,
        notas: { ...state.notas, [action.fecha]: action.nota }
      }

    // CARGAR TODO DESDE LOCALSTORAGE
    case 'CARGAR':
      return action.payload

    default:
      return state
  }
}

// ─────────────────────────────────────────────
// ID ÚNICO
// ─────────────────────────────────────────────
export function nuevoId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

// ─────────────────────────────────────────────
// PROVEEDOR
// ─────────────────────────────────────────────
export function AppProvider({ children, userId }) {
  // Clave única por usuario: cada persona tiene sus propios datos en localStorage
  // Si no hay userId (ej: sin sesión) usa 'local' como fallback
  const STORAGE_KEY = `cajas-control-v1-${userId ?? 'local'}`

  const [estado, dispatch] = useReducer(reducer, undefined, () => {
    // Carga síncrona con la clave del usuario actual
    try {
      const guardado = localStorage.getItem(STORAGE_KEY)
      if (guardado) return { ...estadoVacio, ...JSON.parse(guardado) }
    } catch (e) {
      console.error('Error leyendo localStorage:', e)
    }
    return estadoVacio
  })

  // Guardar en localStorage cada vez que cambia el estado
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(estado))
    } catch (e) {
      console.error('Error guardando datos:', e)
    }
  }, [estado, STORAGE_KEY])

  // ── ACCIONES ────────────────────────────────

  const addPersona = useCallback((nombre) => {
    dispatch({ type: 'ADD_PERSONA', payload: { id: nuevoId(), nombre } })
  }, [])

  const deletePersona = useCallback((id) => {
    dispatch({ type: 'DELETE_PERSONA', payload: id })
  }, [])

  const addCategoria = useCallback((nombre) => {
    dispatch({ type: 'ADD_CATEGORIA', payload: { id: nuevoId(), nombre, activa: true } })
  }, [])

  const toggleCategoria = useCallback((id) => {
    dispatch({ type: 'TOGGLE_CATEGORIA', payload: id })
  }, [])

  const deleteCategoria = useCallback((id) => {
    dispatch({ type: 'DELETE_CATEGORIA', payload: id })
  }, [])

  const setPreciosDia = useCallback((fecha, precios) => {
    dispatch({ type: 'SET_PRECIOS_DIA', fecha, precios })
  }, [])

  const addSalida = useCallback((fecha, personaId, cantidad) => {
    dispatch({
      type: 'ADD_SALIDA',
      payload: { id: nuevoId(), fecha, personaId, cantidad: Number(cantidad) }
    })
  }, [])

  const editSalida = useCallback((id, data) => {
    dispatch({ type: 'EDIT_SALIDA', payload: { id, data } })
  }, [])

  const deleteSalida = useCallback((id) => {
    dispatch({ type: 'DELETE_SALIDA', payload: id })
  }, [])

  const addEntrada = useCallback((fecha, personaId, categoriaId, cantidad, nota = '') => {
    dispatch({
      type: 'ADD_ENTRADA',
      payload: { id: nuevoId(), fecha, personaId, categoriaId, cantidad: Number(cantidad), nota }
    })
  }, [])

  const editEntrada = useCallback((id, data) => {
    dispatch({ type: 'EDIT_ENTRADA', payload: { id, data } })
  }, [])

  const deleteEntrada = useCallback((id) => {
    dispatch({ type: 'DELETE_ENTRADA', payload: id })
  }, [])

  const setInventario = useCallback((fecha, cantidad) => {
    dispatch({ type: 'SET_INVENTARIO', fecha, cantidad: Number(cantidad) })
  }, [])

  const addPlaneacion = useCallback((fecha, personaId, cantidad, nota = '') => {
    dispatch({
      type: 'ADD_PLANEACION',
      payload: { id: nuevoId(), fecha, personaId, cantidad: Number(cantidad), nota }
    })
  }, [])

  const editPlaneacion = useCallback((id, data) => {
    dispatch({ type: 'EDIT_PLANEACION', payload: { id, data } })
  }, [])

  const deletePlaneacion = useCallback((id) => {
    dispatch({ type: 'DELETE_PLANEACION', payload: id })
  }, [])

  const setNota = useCallback((fecha, nota) => {
    dispatch({ type: 'SET_NOTA', fecha, nota })
  }, [])

  // ── SELECTORES (funciones para calcular datos) ────────

  // Salidas de un día específico
  const getSalidasDia = useCallback((fecha) => {
    return estado.salidas.filter(s => s.fecha === fecha)
  }, [estado.salidas])

  // Entradas de un día específico
  const getEntradasDia = useCallback((fecha) => {
    return estado.entradas.filter(e => e.fecha === fecha)
  }, [estado.entradas])

  // Total de cajas salidas en un día
  const getTotalSalidas = useCallback((fecha) => {
    return getSalidasDia(fecha).reduce((acc, s) => acc + s.cantidad, 0)
  }, [getSalidasDia])

  // Total de cajas entradas en un día
  const getTotalEntradas = useCallback((fecha) => {
    return getEntradasDia(fecha).reduce((acc, e) => acc + e.cantidad, 0)
  }, [getEntradasDia])

  // Inventario actual de un día
  const getInventarioActual = useCallback((fecha) => {
    const inicial = estado.inventario[fecha] ?? 0
    return inicial - getTotalSalidas(fecha) + getTotalEntradas(fecha)
  }, [estado.inventario, getTotalSalidas, getTotalEntradas])

  // Precios de un día (copia precios del día anterior si no hay)
  const getPreciosDia = useCallback((fecha) => {
    if (estado.precios[fecha]) return estado.precios[fecha]
    // Buscar precio más reciente anterior a esta fecha
    const fechas = Object.keys(estado.precios).sort()
    const anterior = fechas.filter(f => f < fecha).pop()
    return anterior ? estado.precios[anterior] : {}
  }, [estado.precios])

  // Pago de una persona en un día
  const getPagoPersonaDia = useCallback((personaId, fecha) => {
    const entradas = getEntradasDia(fecha).filter(e => e.personaId === personaId)
    const precios = getPreciosDia(fecha)
    return entradas.reduce((acc, e) => {
      const precio = precios[e.categoriaId] ?? 0
      return acc + (e.cantidad * precio)
    }, 0)
  }, [getEntradasDia, getPreciosDia])

  // Total a pagar en el día
  const getTotalPagoDia = useCallback((fecha) => {
    return estado.personas.reduce((acc, p) => acc + getPagoPersonaDia(p.id, fecha), 0)
  }, [estado.personas, getPagoPersonaDia])

  // Historial de una persona
  const getHistorialPersona = useCallback((personaId) => {
    // Obtener todas las fechas únicas donde trabajó
    const fechas = [...new Set(
      estado.entradas
        .filter(e => e.personaId === personaId)
        .map(e => e.fecha)
    )].sort().reverse()

    return fechas.map(fecha => {
      const entradas = getEntradasDia(fecha).filter(e => e.personaId === personaId)
      const salidas = getSalidasDia(fecha).filter(s => s.personaId === personaId)
      const totalEntregadas = salidas.reduce((a, s) => a + s.cantidad, 0)
      const precios = getPreciosDia(fecha)
      const pago = entradas.reduce((acc, e) => acc + (e.cantidad * (precios[e.categoriaId] ?? 0)), 0)
      return { fecha, entradas, totalEntregadas, pago }
    })
  }, [estado.entradas, getEntradasDia, getSalidasDia, getPreciosDia])

  const value = {
    // Estado
    ...estado,
    // Acciones
    addPersona, deletePersona,
    addCategoria, toggleCategoria, deleteCategoria,
    setPreciosDia,
    addSalida, editSalida, deleteSalida,
    addEntrada, editEntrada, deleteEntrada,
    setInventario,
    addPlaneacion, editPlaneacion, deletePlaneacion,
    setNota,
    // Selectores
    getSalidasDia, getEntradasDia,
    getTotalSalidas, getTotalEntradas,
    getInventarioActual,
    getPreciosDia,
    getPagoPersonaDia,
    getTotalPagoDia,
    getHistorialPersona,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

// ─────────────────────────────────────────────
// HOOK PARA USAR EL CONTEXTO
// ─────────────────────────────────────────────
export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp debe usarse dentro de AppProvider')
  return ctx
}
