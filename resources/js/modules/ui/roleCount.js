import { el } from '@/modules/utils/dom'
import { icon } from './icon'
import api from '@/api/client'
import { normalizeList } from '@/api/resource'
import { extractRole } from '@/modules/utils/roles'
import { t } from '@/modules/i18n'

// Counts accounts by reading the accounts the API returns and counting their `role` field.
// It does NOT rely on a `?role=` filter, so it works even if the API ignores that parameter.
const GROUPS = [
  { value: '', label: 'All', roles: null },
  { value: 'STUDENT', label: 'Student', roles: ['STUDENT'] },
  { value: 'LECTURER', label: 'Lecturer', roles: ['LECTURER'] },
  { value: 'ADMIN', label: 'Admin', roles: ['ADMIN', 'SUPER_ADMIN'] }, // both admin roles
]
const PER_PAGE = 100
const MAX_PAGES = 100 // safety stop

/** Reads every page once: { total, byRole: { STUDENT: 38, ... } } */
async function loadTotals(path) {
  const byRole = {}
  let total = 0
  let page = 1
  let lastPage = 1
  do {
    // const result = normalizeList(await api.get(path, { page, per_page: PER_PAGE }))
        const result = normalizeList(await api.get(path, { page, per_page: PER_PAGE }), PER_PAGE)
    lastPage = result.lastPage
    for (const account of result.items) {
      const role = extractRole(account) ?? 'UNKNOWN'
      byRole[role] = (byRole[role] ?? 0) + 1
      total += 1
    }
    page += 1
  } while (page <= lastPage && page <= MAX_PAGES)
  return { total, byRole }
}

const pick = (totals, group) => (group.roles ? group.roles.reduce((sum, role) => sum + (totals.byRole[role] ?? 0), 0) : totals.total)

/** "User Accounts: 124 [All v]". Returns { el, refresh() }; call refresh() after creating or editing an account. */
export function roleCountBar({ path, label = 'User Accounts' }) {
  const number = el('strong', { class: 'rc-number' }, '…')
  const select = el('select', { class: 'input rc-select', 'aria-label': t('Show count for role') },
    GROUPS.map((g) => el('option', { value: g.value }, t(g.label))))
  const root = el('div', { class: 'card rc-bar', role: 'status' },
    icon('people', 18, 'rc-icon'), el('span', { class: 'rc-label' }, `${t(label)}:`), number, select)
  let totals = null
  let latest = 0

  const show = () => { number.textContent = String(pick(totals, GROUPS.find((g) => g.value === select.value))) }

  async function refresh() {
    const mine = ++latest
    number.textContent = '…'
    number.removeAttribute('title')
    try {
      const loaded = await loadTotals(path)
      if (mine !== latest) return
      totals = loaded
      show()
    } catch {
      if (mine === latest) { number.textContent = '—'; number.title = t('Could not load count') }
    }
  }

  // Changing the dropdown only re-reads the numbers already loaded (no new request).
  select.addEventListener('change', () => { if (totals) show() })
  refresh()
  return { el: root, refresh }
}