import { el } from '@/modules/utils/dom'
import { icon } from './icon'
import { t } from '@/modules/i18n'

/** Same markup as the <x-stat-card> Blade component. A null value shows a dash, never an invented number. */
export function statCard({ label, iconName = null, value = null, loading = false, hint = '' }) {
  return el('div', { class: 'card sc-stat' },
    el('div', { class: 'sc-top' }, el('span', { class: 'sc-label' }, t(label)), iconName ? icon(iconName, 18, 'sc-icon') : null),
    loading ? el('div', { class: 'sc-skeleton', 'aria-label': t('Loading') }) : el('div', { class: 'sc-value' }, value ?? '—'),
    hint ? el('p', { class: 'sc-hint' }, t(hint)) : null)
}

/** Fill the value slots of server-rendered <x-stat-card> elements: values = { key: value | null }. */
export function fillStatCards(root, values, loading = false) {
  for (const card of root.querySelectorAll('[data-stat]')) {
    const slot = card.querySelector('[data-value]')
    const skeleton = card.querySelector('[data-skeleton]')
    slot.textContent = values[card.dataset.stat] ?? '—'
    slot.hidden = loading
    skeleton.hidden = !loading
  }
}
