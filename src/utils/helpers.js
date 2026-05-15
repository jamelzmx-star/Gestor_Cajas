// ─────────────────────────────────────────────
// FORMATO DE FECHAS
// ─────────────────────────────────────────────

// Convierte Date a "YYYY-MM-DD"
export function fechaISO(date = new Date()) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// Formatea "YYYY-MM-DD" → "3 de mayo 2026"
export function fechaLegible(iso) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-').map(Number)
  const meses = [
    'enero','febrero','marzo','abril','mayo','junio',
    'julio','agosto','septiembre','octubre','noviembre','diciembre'
  ]
  return `${d} de ${meses[m - 1]} ${y}`
}

// Formatea "YYYY-MM-DD" → "03/05/26"
export function fechaCorta(iso) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y.slice(2)}`
}

// Hoy en formato ISO
export function hoy() {
  return fechaISO(new Date())
}

// Mañana en formato ISO
export function manana() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return fechaISO(d)
}

// ─────────────────────────────────────────────
// FORMATO DE DINERO
// ─────────────────────────────────────────────

// Formatea número como "$1,500"
export function formatDinero(num) {
  if (num == null || isNaN(num)) return '$0'
  return '$' + Number(num).toLocaleString('es-MX', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })
}

// ─────────────────────────────────────────────
// NOMBRE DE PERSONA / CATEGORÍA
// ─────────────────────────────────────────────
export function getNombre(lista, id) {
  return lista.find(x => x.id === id)?.nombre ?? '(eliminado)'
}
