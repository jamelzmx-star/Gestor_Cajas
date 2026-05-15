import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../components/Toast.jsx'
import Modal from '../components/Modal.jsx'

// Calcula días hasta una fecha ISO
function diasHasta(fechaISO) {
  if (!fechaISO) return null
  const hoy   = new Date(); hoy.setHours(0,0,0,0)
  const vence = new Date(fechaISO + 'T00:00:00')
  return Math.ceil((vence - hoy) / 86400000)
}

function EstadoSuscripcion({ hasta, activo }) {
  if (!activo) return <span className="etiqueta etiqueta-rojo">⛔ Inactivo</span>
  if (!hasta)  return <span className="etiqueta etiqueta-azul">♾️ Sin límite</span>

  const dias = diasHasta(hasta)
  if (dias < 0)  return <span className="etiqueta etiqueta-rojo">❌ Venció</span>
  if (dias <= 7) return <span className="etiqueta etiqueta-naranja">⚠️ Vence en {dias}d</span>
  return <span className="etiqueta etiqueta-verde">✅ Activo ({dias}d)</span>
}

const planesOpciones = [
  { val: 'mensual', label: '📅 Mensual' },
  { val: 'anual',   label: '📆 Anual'   },
  { val: 'libre',   label: '♾️ Sin límite' },
]

// Cuántos días añade cada plan
function diasDePlan(plan) {
  if (plan === 'mensual') return 30
  if (plan === 'anual')   return 365
  return null
}

function sumarDias(dias) {
  if (!dias) return null
  const d = new Date()
  d.setDate(d.getDate() + dias)
  return d.toISOString().split('T')[0]
}

export default function Admin() {
  const { user }   = useAuth()
  const toast      = useToast()

  const [usuarios,  setUsuarios]  = useState([])
  const [cargando,  setCargando]  = useState(true)
  const [filtro,    setFiltro]    = useState('todos')  // todos | activos | inactivos | proximos
  const [busqueda,  setBusqueda]  = useState('')
  const [editando,  setEditando]  = useState(null)
  const [modalEdit, setModalEdit] = useState(false)
  const [guardando, setGuardando] = useState(false)

  // ── Cargar todos los usuarios ──────────────────────────────
  const cargarUsuarios = useCallback(async () => {
    setCargando(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      toast('Error cargando usuarios', 'error')
    } else {
      setUsuarios(data ?? [])
    }
    setCargando(false)
  }, [])

  useEffect(() => { cargarUsuarios() }, [cargarUsuarios])

  // ── Filtros ────────────────────────────────────────────────
  const usuariosFiltrados = usuarios
    .filter(u => {
      const texto = (u.nombre + u.email).toLowerCase()
      if (busqueda && !texto.includes(busqueda.toLowerCase())) return false
      if (filtro === 'activos')   return u.activo
      if (filtro === 'inactivos') return !u.activo
      if (filtro === 'proximos') {
        const dias = diasHasta(u.suscripcion_hasta)
        return u.activo && dias !== null && dias >= 0 && dias <= 7
      }
      return true
    })

  // Contadores para badges
  const cuentasProximas = usuarios.filter(u => {
    const dias = diasHasta(u.suscripcion_hasta)
    return u.activo && dias !== null && dias >= 0 && dias <= 7
  }).length

  // ── Toggle activo/inactivo ─────────────────────────────────
  async function toggleActivo(u) {
    const nuevoEstado = !u.activo
    const { error } = await supabase
      .from('profiles')
      .update({ activo: nuevoEstado })
      .eq('id', u.id)

    if (error) return toast('Error al cambiar estado', 'error')

    setUsuarios(prev => prev.map(x => x.id === u.id ? { ...x, activo: nuevoEstado } : x))
    toast(`${u.nombre} — ${nuevoEstado ? 'activado ✔' : 'desactivado'}`, nuevoEstado ? 'exito' : 'aviso')
  }

  // ── Abrir modal de edición ─────────────────────────────────
  function abrirEditar(u) {
    setEditando({
      id:                u.id,
      nombre:            u.nombre ?? '',
      plan:              u.plan ?? 'mensual',
      suscripcion_hasta: u.suscripcion_hasta ?? '',
      notas:             u.notas ?? '',
      activo:            u.activo,
    })
    setModalEdit(true)
  }

  // ── Renovar suscripción automáticamente según plan ─────────
  function renovar() {
    const dias   = diasDePlan(editando.plan)
    const fecha  = sumarDias(dias)
    setEditando(p => ({ ...p, suscripcion_hasta: fecha ?? '' }))
    if (!dias) toast('Plan libre — sin fecha de vencimiento', 'aviso')
  }

  // ── Guardar cambios del usuario ────────────────────────────
  async function guardarEdicion() {
    setGuardando(true)
    const cambios = {
      nombre:            editando.nombre,
      plan:              editando.plan,
      suscripcion_hasta: editando.suscripcion_hasta || null,
      notas:             editando.notas || null,
      activo:            editando.activo,
    }

    const { error } = await supabase
      .from('profiles')
      .update(cambios)
      .eq('id', editando.id)

    if (error) {
      toast('Error guardando cambios', 'error')
    } else {
      setUsuarios(prev => prev.map(u => u.id === editando.id ? { ...u, ...cambios } : u))
      setModalEdit(false)
      toast('Usuario actualizado ✔', 'exito')
    }
    setGuardando(false)
  }

  // ── Resumen general ────────────────────────────────────────
  const totalUsuarios = usuarios.filter(u => !u.es_admin).length
  const totalActivos  = usuarios.filter(u => u.activo && !u.es_admin).length
  const totalVencidos = usuarios.filter(u => {
    const dias = diasHasta(u.suscripcion_hasta)
    return dias !== null && dias < 0
  }).length

  return (
    <div className="pagina">

      {/* Banner de alertas urgentes */}
      {cuentasProximas > 0 && (
        <div className="alerta alerta-aviso" style={{ cursor: 'pointer' }} onClick={() => setFiltro('proximos')}>
          ⚠️ <strong>{cuentasProximas} cuenta(s)</strong> vencen en los próximos 7 días — toca para ver
        </div>
      )}

      {/* KPIs */}
      <div className="kpi-grid">
        <div className="kpi">
          <span className="kpi-label">Usuarios</span>
          <span className="kpi-valor azul">{totalUsuarios}</span>
          <span className="kpi-sub">Registrados</span>
        </div>
        <div className="kpi">
          <span className="kpi-label">Activos</span>
          <span className="kpi-valor verde">{totalActivos}</span>
          <span className="kpi-sub">Con acceso</span>
        </div>
        <div className="kpi">
          <span className="kpi-label">Vencidos</span>
          <span className={`kpi-valor ${totalVencidos > 0 ? 'rojo' : ''}`}>{totalVencidos}</span>
          <span className="kpi-sub">Sin renovar</span>
        </div>
        <div className="kpi">
          <span className="kpi-label">Por vencer</span>
          <span className={`kpi-valor ${cuentasProximas > 0 ? 'naranja' : ''}`}>{cuentasProximas}</span>
          <span className="kpi-sub">≤ 7 días</span>
        </div>
      </div>

      {/* Búsqueda + filtros */}
      <div className="card" style={{ padding: '12px 14px' }}>
        <div className="buscador" style={{ marginBottom: 10 }}>
          <span className="buscador-icono">🔍</span>
          <input
            className="form-input"
            placeholder="Buscar por nombre o correo..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            { val: 'todos',    label: 'Todos' },
            { val: 'activos',  label: '✅ Activos' },
            { val: 'inactivos',label: '⛔ Inactivos' },
            { val: 'proximos', label: `⚠️ Por vencer${cuentasProximas > 0 ? ` (${cuentasProximas})` : ''}` },
          ].map(f => (
            <button
              key={f.val}
              className={`btn btn-sm ${filtro === f.val ? 'btn-primario' : 'btn-gris'}`}
              onClick={() => setFiltro(f.val)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de usuarios */}
      <div className="card">
        <div className="kpi-label" style={{ marginBottom: 12 }}>
          👥 Usuarios ({usuariosFiltrados.filter(u => !u.es_admin).length})
        </div>

        {cargando ? (
          <div className="vacío">⏳ Cargando...</div>
        ) : usuariosFiltrados.filter(u => !u.es_admin).length === 0 ? (
          <div className="vacío">
            <span className="vacío-icono">👥</span>
            {usuarios.length === 0
              ? 'Aún no hay usuarios registrados'
              : 'Ningún usuario coincide con el filtro'}
          </div>
        ) : (
          <div className="lista">
            {usuariosFiltrados
              .filter(u => !u.es_admin)
              // Ordenar: por vencer primero, luego vencidos, luego el resto
              .sort((a, b) => {
                const da = diasHasta(a.suscripcion_hasta)
                const db = diasHasta(b.suscripcion_hasta)
                if (da !== null && da >= 0 && da <= 7) return -1
                if (db !== null && db >= 0 && db <= 7) return 1
                return 0
              })
              .map(u => (
                <div key={u.id} className="lista-item" style={{ alignItems: 'flex-start' }}>
                  {/* Avatar */}
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%',
                    background: u.activo ? 'var(--azul-fondo)' : 'var(--gris-2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.2rem', flexShrink: 0,
                  }}>
                    {u.activo ? '👤' : '🚫'}
                  </div>

                  {/* Info */}
                  <div className="lista-item-info" style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span className="lista-item-nombre" style={{ fontSize: '0.95rem' }}>
                        {u.nombre || '(sin nombre)'}
                      </span>
                      <EstadoSuscripcion hasta={u.suscripcion_hasta} activo={u.activo} />
                    </div>
                    <div className="lista-item-sub" style={{ marginTop: 3 }}>
                      {u.email}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--gris-4)', marginTop: 2 }}>
                      Plan: {u.plan ?? '—'} · Vence: {u.suscripcion_hasta ?? 'sin límite'}
                    </div>
                    {u.notas && (
                      <div style={{ fontSize: '0.72rem', color: 'var(--amarillo)', marginTop: 2 }}>
                        📝 {u.notas}
                      </div>
                    )}
                  </div>

                  {/* Acciones */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                    <button
                      className={`btn btn-sm ${u.activo ? 'btn-rojo' : 'btn-verde'}`}
                      onClick={() => toggleActivo(u)}
                      style={{ fontSize: '0.75rem' }}
                    >
                      {u.activo ? 'Desactivar' : 'Activar'}
                    </button>
                    <button
                      className="btn btn-gris btn-sm"
                      onClick={() => abrirEditar(u)}
                      style={{ fontSize: '0.75rem' }}
                    >
                      ✏️ Editar
                    </button>
                  </div>
                </div>
              ))
            }
          </div>
        )}
      </div>

      {/* Nota informativa */}
      <div className="alerta alerta-info" style={{ fontSize: '0.8rem' }}>
        ℹ️ Para que un usuario pueda entrar debe: registrarse en la app → tú lo activas aquí y le asignas fecha de vencimiento.
      </div>

      {/* Modal editar usuario */}
      <Modal abierto={modalEdit} onCerrar={() => setModalEdit(false)} titulo="✏️ Editar usuario">
        {editando && (
          <>
            {/* Nombre */}
            <div className="form-group">
              <label className="form-label">Nombre</label>
              <input
                className="form-input"
                value={editando.nombre}
                onChange={e => setEditando(p => ({ ...p, nombre: e.target.value }))}
              />
            </div>

            {/* Activo toggle */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'var(--gris-2)', borderRadius: 'var(--radio-sm)', padding: '10px 14px',
            }}>
              <span style={{ fontWeight: 700 }}>Cuenta activa</span>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={editando.activo}
                  onChange={e => setEditando(p => ({ ...p, activo: e.target.checked }))}
                />
                <span className="toggle-slider" />
              </label>
            </div>

            {/* Plan */}
            <div className="form-group">
              <label className="form-label">Plan</label>
              <select
                className="form-select"
                value={editando.plan}
                onChange={e => setEditando(p => ({ ...p, plan: e.target.value }))}
              >
                {planesOpciones.map(p => (
                  <option key={p.val} value={p.val}>{p.label}</option>
                ))}
              </select>
            </div>

            {/* Renovar automáticamente */}
            <button
              className="btn btn-azul btn-bloque btn-sm"
              style={{ background: 'var(--azul-fondo)', color: 'var(--azul)' }}
              onClick={renovar}
              type="button"
            >
              🔄 Renovar desde hoy ({editando.plan === 'mensual' ? '30 días' : editando.plan === 'anual' ? '365 días' : 'sin límite'})
            </button>

            {/* Fecha manual */}
            <div className="form-group">
              <label className="form-label">Fecha de vencimiento (manual)</label>
              <input
                className="form-input"
                type="date"
                value={editando.suscripcion_hasta}
                onChange={e => setEditando(p => ({ ...p, suscripcion_hasta: e.target.value }))}
              />
              <span style={{ fontSize: '0.72rem', color: 'var(--gris-4)' }}>
                Deja vacío para acceso sin límite
              </span>
            </div>

            {/* Notas internas */}
            <div className="form-group">
              <label className="form-label">Notas internas</label>
              <textarea
                className="form-textarea"
                placeholder="Notas sobre este usuario (solo las ve el admin)"
                value={editando.notas}
                onChange={e => setEditando(p => ({ ...p, notas: e.target.value }))}
                style={{ minHeight: 56 }}
              />
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-gris" style={{ flex: 1 }} onClick={() => setModalEdit(false)}>
                Cancelar
              </button>
              <button className="btn btn-primario" style={{ flex: 2 }} onClick={guardarEdicion} disabled={guardando}>
                {guardando ? '⏳ Guardando...' : '💾 Guardar cambios'}
              </button>
            </div>
          </>
        )}
      </Modal>

    </div>
  )
}
