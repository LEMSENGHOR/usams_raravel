import { el } from '@/modules/utils/dom'
import { icon } from './icon'
import { openModal } from './dialog'
import { cellValue, renderDataTable } from './table'
import { createResource } from '@/api/resource'
import { t } from '@/modules/i18n'

/** Read-only details dialog (replaces DetailDialog.vue), with an optional related-records table. */
export function detailDialog({ title, item, columns, related = null }) {
  const body = el('div', { class: 'dd-body' },
    el('dl', {}, columns.map((c) => el('div', {}, el('dt', {}, t(c.label)), el('dd', {}, cellValue(c, item))))))

  if (related) {
    const holder = el('div')
    body.append(el('section', { class: 'dd-related' }, el('h3', {}, t(related.title)), holder))
    const draw = (state) => renderDataTable(holder, { columns: related.columns, emptyTitle: 'No records', ...state })
    const load = async () => {
      draw({ loading: true })
      try {
        const { items } = await createResource(related.path).list({ [related.param]: item.id, per_page: 50 })
        draw({ rows: items })
      } catch (error) { draw({ error, onRetry: load }) }
    }
    load()
  }

  const dialog = el('dialog', { class: 'dd-backdrop', 'aria-labelledby': 'dd-title' },
    el('section', { class: 'dd-dialog card dd-root' },
      el('header', { class: 'dd-head' },
        el('h2', { id: 'dd-title' }, t(title)),
        el('button', { class: 'dd-x', type: 'button', 'aria-label': t('Close'), onclick: () => dialog.close() }, icon('x-lg', 18))),
      body))
  openModal(dialog)
  return { dialog }
}
