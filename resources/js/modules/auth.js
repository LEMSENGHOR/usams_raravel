import { authApi } from '@/api/auth'
import { tokenStorage } from '@/modules/utils/tokenStorage'
import { ADMIN_ROLES, LECTURER_ROLES, extractRole, homeForRole } from '@/modules/utils/roles'
import { url } from '@/modules/utils/helpers'
import { t } from '@/modules/i18n'
import { navigate } from '@/modules/utils/nav'

// Account statuses that must never reach a dashboard (value names from your spec).
const BLOCKED_STATUSES = ['INACTIVE', 'SUSPENDED']

let current = null
let ready = false

export const getUser = () => current
export const getRole = () => extractRole(current)
export const getHomePath = () => homeForRole(getRole())

export function clearSession() {
  current = null
  tokenStorage.clear()
}

function assertUsable(u) {
  const status = String(u?.status ?? u?.account_status ?? 'ACTIVE').toUpperCase()
  if (BLOCKED_STATUSES.includes(status)) {
    throw { status: 403, code: `ACCOUNT_${status}`, message: status === 'SUSPENDED' ? t('This account is suspended. Contact an administrator.') : t('This account is inactive. Contact an administrator.') }
  }
  if (!homeForRole(extractRole(u))) {
    throw { status: 403, code: 'NO_DASHBOARD', message: t('This account does not have access to the dashboard.') }
  }
}

/** Returns the home path for the signed-in role. Throws the normalized API error (or a 403) on failure. */
export async function login(credentials) {
  const { token, user } = await authApi.login(credentials)
  try {
    assertUsable(user)
  } catch (e) {
    // Do not keep a session for a blocked account.
    if (token) tokenStorage.set(token, false)
    try { await authApi.logout() } catch { /* ignore */ }
    clearSession()
    throw e
  }
  tokenStorage.set(token, !!credentials.remember)
  current = user
  return getHomePath()
}

/** Called once per page load: restore the session from the stored token. */
export async function restore() {
  if (ready) return
  if (tokenStorage.get()) {
    try {
      const u = await authApi.me()
      assertUsable(u)
      current = u
    } catch {
      clearSession()
    }
  }
  ready = true
}

export async function logout() {
  try { await authApi.logout() } catch { /* session may already be gone */ }
  clearSession()
}

/**
 * Client-side route guard (replaces the Vue Router guard). UX only: Laravel's API stays the source of truth.
 * Returns true when the page may render; otherwise it redirects and returns false.
 */
export async function guard(area) {
  await restore()
  const here = window.location.pathname.slice((window.USAMS?.base ?? '').length) + window.location.search

  if (area === 'guest') {
    if (current) { navigate.replace(url(getHomePath() ?? '/login')); return false }
    return true
  }
  if (area === 'any') return true

  if (!current) {
    navigate.replace(url(`/login?redirect=${encodeURIComponent(here)}`))
    return false
  }
  const allowed = area === 'admin' ? ADMIN_ROLES : LECTURER_ROLES
  if (!allowed.includes(getRole())) {
    navigate.replace(url('/forbidden'))
    return false
  }
  return true
}
