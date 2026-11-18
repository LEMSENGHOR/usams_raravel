import { el } from '@/modules/utils/dom'
import { t } from '@/modules/i18n'

/** Same markup as the <x-page-header> Blade component, for pages whose title is only known after loading. */
export function pageHeader({ title, subtitle = '', actions = null }) {
  return el('header', { class: 'ph-page-header' },
    el('div', {}, el('h1', {}, t(title)), subtitle ? el('p', { class: 'ph-subtitle' }, t(subtitle)) : null),
    el('div', { class: 'ph-actions' }, actions))
}
