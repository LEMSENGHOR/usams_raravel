// Client-side CSV export. Uses only data already loaded on screen.
const DANGEROUS = /^[=+\-@\t\r]/

function cell(v) {
  let s = v == null ? '' : String(v)
  if (DANGEROUS.test(s)) s = `'${s}` // stops Excel running a value as a formula
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/** columns: [{ label, get: (row) => value }] */
export function toCsv(columns, rows) {
  const head = columns.map((c) => cell(c.label)).join(',')
  const body = rows.map((r) => columns.map((c) => cell(c.get(r))).join(','))
  return [head, ...body].join('\r\n')
}

export function downloadCsv(filename, csv) {
  // BOM makes Excel read Khmer and other non-ASCII text as UTF-8.
  const blob = new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
