import { el } from '@/modules/utils/dom'

/** Bootstrap Icons: icon('plus-lg', 16) -> <i class="bi bi-plus-lg">. */
export const icon = (name, size = 16, extraClass = '') =>
  el('i', { class: `bi bi-${name}${extraClass ? ` ${extraClass}` : ''}`, 'aria-hidden': 'true', style: { fontSize: `${size}px` } })
