import { el } from '@/modules/utils/dom'
import { t } from '@/modules/i18n'

// Four manual statuses from the spec. No "pending" option: an unmarked student simply has no selection.
const OPTIONS = [
  { value: 'PRESENT', label: 'Present', tone: 'success' },
  { value: 'LATE', label: 'Late', tone: 'warning' },
  { value: 'ABSENT', label: 'Absent', tone: 'danger' },
  { value: 'EXCUSED', label: 'Excused', tone: 'info' },
]

/** Replaces StatusSegmented.vue. Returns { el, setValue(value) }. */
export function statusSegmented({ name, value = null, disabled = false, onChange = () => {} }) {
  const buttons = OPTIONS.map((o) => el('button', {
    type: 'button', role: 'radio', class: `sg-opt sg-t-${o.tone}`, title: t(o.label), disabled, dataset: { value: o.value },
    onclick: () => { setValue(o.value); onChange(o.value) },
  }, el('span', { class: 'sg-short', 'aria-hidden': 'true' }, Array.from(t(o.label))[0]), el('span', { class: 'sg-full' }, t(o.label))))

  function setValue(next) {
    value = next
    for (const b of buttons) {
      const on = b.dataset.value === value
      b.classList.toggle('sg-on', on)
      b.setAttribute('aria-checked', String(on))
    }
  }
  setValue(value)
  const root = el('div', { class: 'sg-seg', role: 'radiogroup', 'aria-label': t('Attendance status for {name}', { name }) }, buttons)
  return { el: root, setValue }
}
