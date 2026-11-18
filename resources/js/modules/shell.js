import { qs, qsa, el } from '@/modules/utils/dom'
import { getUser, getRole, logout } from '@/modules/auth'
import { confirmDialog } from '@/modules/ui/dialog'
import { statusBadge } from '@/modules/ui/badge'
import { url } from '@/modules/utils/helpers'
import { t } from '@/modules/i18n'
import { navigate } from '@/modules/utils/nav'

const COLLAPSE_KEY = 'usams_sidebar_collapsed'

/** Pages with unsaved work set this so a language switch can ask before reloading. */
export const dirtyGuard = { check: () => false, leaving: false, dispose: null }

/** Sidebar, top bar and user menu behavior (replaces AppShell / AppSidebar / AppTopbar logic). */
export function initShell() {
  const sidebar = qs('#sidebar')
  const wrap = qs('#main-wrap')
  const scrim = qs('#sidebar-scrim')
  if (!sidebar || !wrap) return

  // ---- collapse (desktop) ----
  const collapseBtn = qs('#btn-collapse')
  let collapsed = localStorage.getItem(COLLAPSE_KEY) === '1'
  const paintCollapse = () => {
    sidebar.classList.toggle('sb-collapsed', collapsed)
    wrap.classList.toggle('sh-collapsed', collapsed)
    if (collapseBtn) {
      collapseBtn.setAttribute('aria-label', collapsed ? collapseBtn.dataset.labelExpand : collapseBtn.dataset.labelCollapse)
      collapseBtn.firstElementChild.className = `bi ${collapsed ? 'bi-layout-sidebar' : 'bi-layout-sidebar-inset'}`
    }
  }
  collapseBtn?.addEventListener('click', () => {
    collapsed = !collapsed
    localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0')
    paintCollapse()
  })
  paintCollapse()

  // ---- mobile drawer ----
  const setDrawer = (open) => {
    sidebar.classList.toggle('sb-open', open)
    if (scrim) scrim.hidden = !open
  }
  qs('#btn-open-menu')?.addEventListener('click', () => setDrawer(true))
  qs('#btn-close-menu')?.addEventListener('click', () => setDrawer(false))
  scrim?.addEventListener('click', () => setDrawer(false))
  for (const link of qsa('.sb-link', sidebar)) link.addEventListener('click', () => setDrawer(false))

  // ---- user menu ----
  const user = getUser()
  if (user) {
    const name = user.name ?? ''
    qs('#user-avatar').textContent = (name || '?').charAt(0).toUpperCase()
    qs('#user-name').textContent = name
    qs('#user-name-full').textContent = name
    qs('#user-email').textContent = user.email ?? ''
    qs('#user-role').replaceChildren(statusBadge(getRole() ?? ''))
  }
  const menuBtn = qs('#user-menu-btn')
  const dropdown = qs('#user-dropdown')
  const setMenu = (open) => {
    dropdown.hidden = !open
    menuBtn.setAttribute('aria-expanded', String(open))
  }
  menuBtn.addEventListener('click', () => setMenu(dropdown.hidden))
  const userMenu = qs('#user-menu')
  document.addEventListener('click', (e) => { if (!userMenu.contains(e.target)) setMenu(false) })
  userMenu.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false) })

  // ---- sign out ----
  qs('#btn-logout').addEventListener('click', () => {
    setMenu(false)
    confirmDialog({
      title: 'Sign out?',
      message: 'You will need to sign in again to continue.',
      confirmLabel: 'Sign out',
      onConfirm: async () => {
        await logout()
        navigate.replace(url('/login'))
      },
    })
  })

  // ---- language switch reloads the page, so protect unsaved work ----
  for (const link of qsa('[data-language-toggle] a')) {
    link.addEventListener('click', (e) => {
      if (!dirtyGuard.check()) return
      if (window.confirm(t('You have unsaved attendance changes. Leave without saving?'))) dirtyGuard.leaving = true
      else e.preventDefault()
    })
  }
}
