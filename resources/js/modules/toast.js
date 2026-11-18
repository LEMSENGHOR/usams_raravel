import { el, qs } from '@/modules/utils/dom'
import { icon } from '@/modules/ui/icon'
import { t } from '@/modules/i18n'

const ICONS = { success: 'check-circle', error: 'exclamation-circle', info: 'info-circle' }
let nextId = 1

function root() {
  let node = qs('#toasts')
  if (!node) {
    node = el('div', { class: 'tc-toasts', id: 'toasts', 'aria-live': 'polite' })
    document.body.append(node)
  }
  return node
}

function dismiss(node) {
  node?.remove()
}

/** Same API as the Pinia toast store: push / success / error. Text is translated here. */
function push({ type = 'info', title, message = '', duration = 5000 }) {
  const id = nextId++
  const node = el('div', { class: `tc-toast card tc-toast-${type}`, role: 'status', dataset: { toastId: String(id) } },
    icon(ICONS[type] ?? 'info-circle', 20),
    el('div', { class: 'tc-body' }, el('strong', {}, t(title)), message ? el('span', {}, t(message)) : null),
    el('button', { type: 'button', class: 'tc-close', 'aria-label': t('Dismiss notification'), onclick: () => dismiss(node) }, icon('x-lg', 16)),
  )
  root().append(node)
  if (duration) setTimeout(() => dismiss(node), duration)
  return id
}

export const toast = {
  push,
  success: (title, message) => push({ type: 'success', title, message }),
  error: (title, message) => push({ type: 'error', title, message, duration: 8000 }),
}
