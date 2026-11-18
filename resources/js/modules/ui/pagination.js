import { el, clear } from '@/modules/utils/dom'
import { icon } from './icon'
import { t } from '@/modules/i18n'

/** Replaces Pagination.vue. Draws nothing when there is a single page and no records. */
export function renderPagination(container, { page = 1, lastPage = 1, total = 0, onChange }) {
  clear(container)
  if (!(lastPage > 1 || total)) return
  container.append(el('nav', { class: 'pg-pager', 'aria-label': t('Pagination') },
    el('span', { class: 'pg-info' }, `${total === 1 ? t('{total} record', { total }) : t('{total} records', { total })} · ${t('Page {page} of {last}', { page, last: lastPage })}`),
    el('div', { class: 'pg-btns' },
      el('button', { class: 'btn', type: 'button', disabled: page <= 1, onclick: () => onChange(page - 1) }, icon('chevron-left'), t('Previous')),
      el('button', { class: 'btn', type: 'button', disabled: page >= lastPage, onclick: () => onChange(page + 1) }, t('Next'), icon('chevron-right')))))
}
