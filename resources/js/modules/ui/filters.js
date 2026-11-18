import { el } from '@/modules/utils/dom'
import { icon } from './icon'
import { t, tl } from '@/modules/i18n'
import { staticOptions, loadRemoteOptions } from '@/api/options'

function filterControl(filter, onChange) {
  const id = `flt-${filter.key}`
  const label = el('label', { for: id, class: 'sr-only' }, t(filter.label))
  let control

  if (!filter.type || filter.type === 'select') {
    const allOption = (text) => el('option', { value: '' }, text)
    control = el('select', { id, class: 'input' }, allOption(t('All {items}', { items: tl(filter.label) })))
    const fill = (options) => control.append(...options.map((o) => el('option', { value: String(o.value) }, o.i18n ? t(o.label) : o.label)))
    const fixed = staticOptions(filter)
    if (fixed) fill(fixed)
    else if (filter.remote) {
      control.disabled = true
      control.firstChild.textContent = t('Loading…')
      loadRemoteOptions(filter)
        .then(fill)
        .catch(() => {})
        .finally(() => {
          control.disabled = false
          control.firstChild.textContent = t('All {items}', { items: tl(filter.label) })
        })
    }
  } else {
    control = el('input', { id, class: 'input', type: filter.type, placeholder: t(filter.label), 'aria-label': t(filter.label) })
  }
  control.addEventListener('change', () => onChange(control.value))
  return { field: el('div', { class: 'field' }, label, control), control }
}

/**
 * Search box + filter dropdowns (replaces SearchAndFilterBar.vue and FilterControl.vue).
 * Search is debounced by 350 ms. "Clear" appears when anything is set.
 */
export function searchAndFilterBar({ filters = [], showSearch = true, placeholder = 'Search', onSearch = () => {}, onFilter = () => {} }) {
  const values = Object.fromEntries(filters.map((f) => [f.key, '']))
  let query = ''
  let timer = null

  const clearBtn = el('button', { class: 'btn sf-btn', type: 'button', hidden: true, onclick: reset }, icon('x-lg'), t('Clear'))
  const refresh = () => { clearBtn.hidden = !(query || Object.values(values).some(Boolean)) }

  const input = showSearch
    ? el('input', {
        class: 'input sf-input', type: 'search', placeholder: t(placeholder), 'aria-label': t(placeholder),
        oninput: (e) => {
          query = e.target.value
          refresh()
          clearTimeout(timer)
          timer = setTimeout(() => onSearch(query.trim()), 350)
        },
      })
    : null

  const controls = filters.map((f) => {
    const { field, control } = filterControl(f, (value) => { values[f.key] = value; refresh(); onFilter(f.key, value) })
    return { key: f.key, field, control }
  })

  function reset() {
    clearTimeout(timer)
    query = ''
    if (input) input.value = ''
    onSearch('')
    for (const c of controls) {
      if (values[c.key]) { values[c.key] = ''; c.control.value = ''; onFilter(c.key, '') }
    }
    refresh()
  }

  return el('form', { class: 'sf-bar', role: 'search', onsubmit: (e) => { e.preventDefault(); clearTimeout(timer); onSearch(query.trim()) } },
    input ? el('div', { class: 'sf-search' }, icon('search'), input) : null,
    controls.map((c) => c.field),
    clearBtn)
}
