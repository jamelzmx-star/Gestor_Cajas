import React, { useState, useRef } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../components/Toast.jsx'
import { hoy, fechaLegible, formatDinero, fechaISO } from '../utils/helpers.js'
import Modal from '../components/Modal.jsx'

export default function Exportar() {
  const {
    personas, categorias,
    salidas, entradas, inventario,
    getPreciosDia, getPagoPersonaDia, getTotalPagoDia,
    getTotalSalidas, getTotalEntradas, getInventarioActual,
    notas, planeacion, precios,
  } = useApp()

  const { perfil } = useAuth()
  const toast      = useToast()

  const [tipo,          setTipo]          = useState('dia')
  const [fecha,         setFecha]         = useState(hoy())
  const [modalRestaurar, setModalRestaurar] = useState(false)
  const [archivoInfo,   setArchivoInfo]   = useState(null)  // info del JSON cargado
  const [jsonCargado,   setJsonCargado]   = useState(null)  // datos del JSON
  const inputFileRef = useRef(null)

  // ── Exportar Excel ──────────────────────────────────────────
  function getRango() {
    if (tipo === 'dia') {
      return [fecha]
    } else if (tipo === 'semana') {
      const d = new Date(fecha + 'T00:00:00')
      const diaSemana = d.getDay()
      const lunes = new Date(d)
      lunes.setDate(d.getDate() - (diaSemana === 0 ? 6 : diaSemana - 1))
      return Array.from({ length: 7 }, (_, i) => {
        const dia = new Date(lunes)
        dia.setDate(lunes.getDate() + i)
        return fechaISO(dia)
      })
    } else {
      const [y, m] = fecha.split('-')
      const diasEnMes = new Date(Number(y), Number(m), 0).getDate()
      return Array.from({ length: diasEnMes }, (_, i) => {
        const d = String(i + 1).padStart(2, '0')
        return `${y}-${m}-${d}`
      })
    }
  }

  async function exportarExcel() {
    try {
      const { utils, writeFile } = await import('xlsx')
      const rango = getRango()

      const filasResumen = rango.map(f => {
        const invI = inventario[f] ?? 0
        const ts   = getTotalSalidas(f)
        const te   = getTotalEntradas(f)
        const tp   = getTotalPagoDia(f)
        return {
          'Fecha':          fechaLegible(f),
          'Inv. Inicial':   invI,
          'Total Salidas':  ts,
          'Total Entradas': te,
          'Inv. Final':     invI - ts + te,
          'Total a Pagar':  tp,
        }
      }).filter(r => r['Total Salidas'] > 0 || r['Total Entradas'] > 0 || r['Inv. Inicial'] > 0)

      const filasDetalle = []
      rango.forEach(f => {
        const preciosDia = getPreciosDia(f)
        personas.forEach(p => {
          const entradasP  = entradas.filter(e => e.fecha === f && e.personaId === p.id)
          const salidasP   = salidas.filter(s => s.fecha === f && s.personaId === p.id)
          const totalEntregadas = salidasP.reduce((a, s) => a + s.cantidad, 0)
          if (entradasP.length === 0 && totalEntregadas === 0) return
          const porCategoria = categorias.reduce((acc, cat) => {
            const total = entradasP.filter(e => e.categoriaId === cat.id).reduce((a, e) => a + e.cantidad, 0)
            return { ...acc, [cat.nombre]: total }
          }, {})
          const pago = getPagoPersonaDia(p.id, f)
          filasDetalle.push({
            'Fecha':     fechaLegible(f),
            'Persona':   p.nombre,
            'Entregadas': totalEntregadas,
            ...porCategoria,
            'Pago':      pago,
          })
        })
      })

      if (filasResumen.length === 0 && filasDetalle.length === 0)
        return toast('No hay datos para exportar en ese período', 'aviso')

      const wb = utils.book_new()
      if (filasResumen.length > 0) utils.book_append_sheet(wb, utils.json_to_sheet(filasResumen), 'Resumen')
      if (filasDetalle.length > 0) utils.book_append_sheet(wb, utils.json_to_sheet(filasDetalle), 'Detalle por persona')

      writeFile(wb, `cajas-${tipo}-${fecha}.xlsx`)
      toast('Excel descargado ✔', 'exito')
    } catch (err) {
      console.error(err)
      toast('Error al generar el Excel', 'error')
    }
  }

  // ── Exportar respaldo JSON ──────────────────────────────────
  function exportarJSON() {
    const todosLosDatos = {
      version:    2,
      exportado:  new Date().toISOString(),
      usuario:    perfil?.nombre ?? 'desconocido',
      personas,
      categorias,
      precios,
      salidas,
      entradas,
      inventario,
      planeacion,
      notas,
    }

    const json  = JSON.stringify(todosLosDatos, null, 2)
    const blob  = new Blob([json], { type: 'application/json' })
    const url   = URL.createObjectURL(blob)
    const link  = document.createElement('a')
    link.href   = url
    link.download = `respaldo-cajas-${hoy()}.json`
    link.click()
    URL.revokeObjectURL(url)
    toast('Respaldo descargado ✔ — guárdalo en Google Drive o WhatsApp', 'exito')
  }

  // ── Cargar archivo JSON para restaurar ──────────────────────
  function seleccionarArchivo(e) {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const datos = JSON.parse(ev.target.result)
        // Validar que sea un respaldo válido
        if (!datos.personas || !datos.salidas || !datos.entradas)
          return toast('El archivo no parece un respaldo válido', 'error')

        setJsonCargado(datos)
        setArchivoInfo({
          nombre:     file.name,
          exportado:  datos.exportado ? new Date(datos.exportado).toLocaleString('es-MX') : 'desconocido',
          usuario:    datos.usuario ?? 'desconocido',
          personas:   datos.personas?.length ?? 0,
          salidas:    datos.salidas?.length ?? 0,
          entradas:   datos.entradas?.length ?? 0,
        })
        setModalRestaurar(true)
      } catch {
        toast('Error leyendo el archivo. ¿Es un JSON válido?', 'error')
      }
    }
    reader.readAsText(file)
    // Limpiar input para poder cargar el mismo archivo de nuevo
    e.target.value = ''
  }

  function confirmarRestaurar() {
    if (!jsonCargado) return

    // Guardar en localStorage con la clave actual
    const STORAGE_KEY = `cajas-control-v1-${perfil?.id ?? 'local'}`

    // Quitar campos de metadatos del respaldo antes de guardar
    const { version, exportado, usuario, ...datosLimpios } = jsonCargado

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(datosLimpios))
      setModalRestaurar(false)
      toast('Datos restaurados ✔ — recarga la página para verlos', 'exito')
      // Recargar la página para que AppContext cargue los nuevos datos
      setTimeout(() => window.location.reload(), 1500)
    } catch (err) {
      toast('Error al restaurar los datos', 'error')
    }
  }

  // ── Estadísticas del respaldo actual ────────────────────────
  const totalRegistros = salidas.length + entradas.length
  const fechasUnicas   = [...new Set([...salidas, ...entradas].map(r => r.fecha))].length

  return (
    <div className="pagina">

      {/* ─── SECCIÓN: Respaldo JSON ─────────────────────────── */}
      <div className="card">
        <div className="kpi-label" style={{ marginBottom: 4 }}>🔒 Respaldo de seguridad</div>
        <p style={{ fontSize: '0.82rem', color: 'var(--gris-5)', marginBottom: 14, lineHeight: 1.5 }}>
          Exporta todos tus datos en un archivo JSON. Guárdalo en
          Google Drive, WhatsApp o correo. Úsalo si cambias de
          celular o borras el caché del navegador.
        </p>

        {/* Estadísticas del respaldo */}
        <div style={{
          background: 'var(--gris-2)', borderRadius: 'var(--radio-sm)',
          padding: '10px 14px', marginBottom: 14,
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, textAlign: 'center',
        }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{personas.length}</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--gris-5)', textTransform: 'uppercase', fontWeight: 700 }}>Personas</div>
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{totalRegistros}</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--gris-5)', textTransform: 'uppercase', fontWeight: 700 }}>Registros</div>
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{fechasUnicas}</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--gris-5)', textTransform: 'uppercase', fontWeight: 700 }}>Días</div>
          </div>
        </div>

        <button className="btn btn-primario btn-bloque" onClick={exportarJSON}>
          📥 Descargar respaldo JSON
        </button>
      </div>

      {/* ─── SECCIÓN: Restaurar ─────────────────────────────── */}
      <div className="card">
        <div className="kpi-label" style={{ marginBottom: 4 }}>♻️ Restaurar respaldo</div>
        <p style={{ fontSize: '0.82rem', color: 'var(--gris-5)', marginBottom: 14, lineHeight: 1.5 }}>
          Carga un archivo JSON guardado anteriormente para
          recuperar tus datos.
        </p>

        <div className="alerta alerta-aviso" style={{ marginBottom: 14 }}>
          ⚠️ Restaurar <strong>reemplaza todos tus datos actuales</strong>.
          Haz un respaldo primero si tienes información reciente.
        </div>

        <input
          ref={inputFileRef}
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          onChange={seleccionarArchivo}
        />
        <button
          className="btn btn-gris btn-bloque"
          onClick={() => inputFileRef.current?.click()}
        >
          📂 Seleccionar archivo JSON
        </button>
      </div>

      {/* ─── SECCIÓN: Exportar Excel ────────────────────────── */}
      <div className="card">
        <div className="kpi-label" style={{ marginBottom: 12 }}>📊 Exportar a Excel</div>

        <div className="alerta alerta-info" style={{ marginBottom: 14 }}>
          El Excel tendrá dos hojas: <strong>Resumen</strong> (inventario por día)
          y <strong>Detalle</strong> (cajas y pagos por persona).
        </div>

        {/* Tipo */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          {[
            { val: 'dia',    label: '📅 Un día'  },
            { val: 'semana', label: '📆 Semana'  },
            { val: 'mes',    label: '🗓️ Mes'     },
          ].map(op => (
            <button
              key={op.val}
              className={`btn ${tipo === op.val ? 'btn-primario' : 'btn-gris'}`}
              style={{ flex: 1, fontSize: '0.82rem' }}
              onClick={() => setTipo(op.val)}
            >
              {op.label}
            </button>
          ))}
        </div>

        <div className="form-group" style={{ marginBottom: 14 }}>
          <label className="form-label">
            {tipo === 'dia' ? 'Fecha' : tipo === 'semana' ? 'Cualquier día de la semana' : 'Cualquier día del mes'}
          </label>
          <input
            type="date"
            className="form-input"
            value={fecha}
            max={hoy()}
            onChange={e => setFecha(e.target.value)}
          />
        </div>

        {tipo !== 'dia' && (
          <div style={{
            background: 'var(--gris-2)', borderRadius: 'var(--radio-sm)',
            padding: '10px 12px', fontSize: '0.8rem', color: 'var(--gris-5)',
            marginBottom: 14,
          }}>
            {tipo === 'semana'
              ? `Semana completa que contiene el ${fechaLegible(fecha)}`
              : `Todo el mes de ${fechaLegible(fecha).split(' ').slice(2).join(' ')}`
            }
          </div>
        )}

        <button className="btn btn-verde btn-bloque" onClick={exportarExcel}>
          📥 Descargar Excel
        </button>
      </div>

      {/* ─── Modal confirmar restaurar ──────────────────────── */}
      <Modal
        abierto={modalRestaurar}
        onCerrar={() => { setModalRestaurar(false); setJsonCargado(null); setArchivoInfo(null) }}
        titulo="♻️ Confirmar restauración"
      >
        {archivoInfo && (
          <>
            <div style={{
              background: 'var(--gris-2)', borderRadius: 'var(--radio-sm)',
              padding: '12px 14px', marginBottom: 4,
            }}>
              <div style={{ fontWeight: 700, marginBottom: 6, fontSize: '0.85rem' }}>
                📄 {archivoInfo.nombre}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--gris-5)', lineHeight: 1.8 }}>
                <div>👤 Usuario: <strong>{archivoInfo.usuario}</strong></div>
                <div>🕐 Exportado: <strong>{archivoInfo.exportado}</strong></div>
                <div>👥 Personas: <strong>{archivoInfo.personas}</strong></div>
                <div>📤 Salidas: <strong>{archivoInfo.salidas}</strong></div>
                <div>📥 Entradas: <strong>{archivoInfo.entradas}</strong></div>
              </div>
            </div>

            <div className="alerta alerta-error">
              🚨 Esto <strong>borrará todos tus datos actuales</strong> y los
              reemplazará con este respaldo. Esta acción no se puede deshacer.
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn btn-gris"
                style={{ flex: 1 }}
                onClick={() => { setModalRestaurar(false); setJsonCargado(null); setArchivoInfo(null) }}
              >
                Cancelar
              </button>
              <button
                className="btn btn-rojo"
                style={{ flex: 2 }}
                onClick={confirmarRestaurar}
              >
                ♻️ Sí, restaurar
              </button>
            </div>
          </>
        )}
      </Modal>

    </div>
  )
}
