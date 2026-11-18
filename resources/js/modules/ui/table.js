import { el, clear } from '@/modules/utils/dom'
import { getPath, fmtDate, fmtTime } from '@/modules/utils/helpers'
import { t } from '@/modules/i18n'
import { statusBadge } from './badge'
import { emptyState, errorState, loadingSkeleton } from './states'

/** One cell, formatted by column type (badge, bool, date, time, text). Replaces CellValue.vue. */
export function cellValue(col, row) {
  const raw = col.value ? col.value(row) : getPath(row, col.key)
  if (col.type === 'badge' && raw) return statusBadge(String(raw))
  if (col.type === 'bool') return el('span', { class: `cv-pill${raw ? ' cv-on' : ''}` }, raw ? t(col.trueLabel ?? 'Yes') : '—')
  let text = raw
  if (raw === null || raw === undefined || raw === '') text = '—'
  else if (col.type === 'date') text = fmtDate(raw)
  else if (col.type === 'time') text = fmtTime(raw)
  return el('span', {}, String(text))
}

/**
 * Draws a data table, or its loading / error / empty state, into `container` (replaces DataTable.vue).
 * actions(row) returns the row's action buttons (Node or array of Nodes).
 */
export function renderDataTable(container, { columns, rows = [], loading = false, error = null, emptyTitle = 'Nothing here yet', emptyText = '', emptyAction = null, actions = null, onRetry = null }) {
  clear(container)
  if (error) return container.append(errorState({ message: error.message, onRetry }))
  if (loading && !rows.length) return container.append(loadingSkeleton())
  if (!rows.length) return container.append(emptyState({ icon: 'inbox', title: emptyTitle, description: emptyText, action: emptyAction }))

  const head = el('tr', {},
    columns.map((c) => el('th', { scope: 'col' }, t(c.label))),
    actions ? el('th', { scope: 'col', class: 'dt-actions-col' }, el('span', { class: 'sr-only' }, t('Actions'))) : null)
  const body = rows.map((row) => el('tr', {},
    columns.map((c) => el('td', {}, cellValue(c, row))),
    actions ? el('td', { class: 'dt-actions-col' }, el('div', { class: 'dt-actions' }, actions(row))) : null))
  container.append(el('div', { class: 'dt-scroll dt-root', 'aria-busy': String(loading) },
    el('table', {}, el('thead', {}, head), el('tbody', {}, body))))
}
