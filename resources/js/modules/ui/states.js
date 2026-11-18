import { el } from '@/modules/utils/dom'
import { icon } from './icon'
import { t } from '@/modules/i18n'

export function emptyState({ icon: name = null, title, description = '', action = null }) {
  return el('div', { class: 'es-empty' },
    name ? icon(name, 32) : null,
    el('h2', {}, t(title)),
    description ? el('p', {}, t(description)) : null,
    el('div', { class: 'es-slot' }, action),
  )
}

export function errorState({ title = 'Could not load this data', message = '', onRetry = null }) {
  return el('div', { class: 'er-error', role: 'alert' },
    icon('exclamation-triangle', 28),
    el('h2', {}, t(title)),
    message ? el('p', {}, message) : null,
    el('button', { class: 'btn er-btn', type: 'button', onclick: () => onRetry?.() }, t('Try again')),
  )
}

export function loadingSkeleton(rows = 5) {
  return el('div', { class: 'ls-skeleton', 'aria-busy': 'true', 'aria-label': t('Loading') },
    Array.from({ length: rows }, () => el('div', { class: 'ls-row' })))
}
