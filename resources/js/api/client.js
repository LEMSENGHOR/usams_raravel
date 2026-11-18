import { endpoints } from '@/modules/config/endpoints'
import { locale, t } from '@/modules/i18n'
import { tokenStorage } from '@/modules/utils/tokenStorage'
import { toast } from '@/modules/toast'
import { navigate } from '@/modules/utils/nav'

const cfg = window.USAMS ?? {}
export const API_BASE = cfg.apiBase ?? '/api'
export const BASE_PATH = cfg.base ?? ''

function buildUrl(path, params) {
  const query = new URLSearchParams()
  for (const [k, v] of Object.entries(params ?? {})) if (v !== undefined && v !== null && v !== '') query.append(k, v)
  const qs = query.toString()
  return `${API_BASE}${path}${qs ? `?${qs}` : ''}`
}

/**
 * Turns any failed response into one predictable shape so pages never parse raw errors.
 * { status, message, fieldErrors }  (fieldErrors: { email: ['...'] } for 422). Same shape as the Vue app.
 */
export function normalizeError(status, data) {
  const fieldErrors = status === 422 ? data?.errors ?? {} : {}
  let message = data?.message
  if (!message) {
    message =
      status === 0 ? t('Cannot reach the server. Check your connection and try again.')
      : status === 401 ? t('Your session has expired. Sign in again.')
      : status === 403 ? t('You do not have permission to do this.')
      : status === 404 ? t('The requested item was not found.')
      : status === 422 ? t('Some fields are invalid.')
      : t('Something went wrong on the server. Try again later.')
  }
  return { status, message, fieldErrors }
}

function handleError(error, path) {
  const isAuthCall = path.includes(endpoints.auth.login)
  if (error.status === 401 && !isAuthCall) {
    tokenStorage.clear()
    if (document.body.dataset.area !== 'guest') {
      const here = window.location.pathname.slice(BASE_PATH.length) + window.location.search
      navigate.replace(`${BASE_PATH}/login?redirect=${encodeURIComponent(here)}&reason=expired`)
    }
  } else if (error.status === 403 && !isAuthCall) {
    toast.push({ type: 'error', title: t('Not allowed'), message: error.message })
  } else if (error.status >= 500 || error.status === 0) {
    toast.push({ type: 'error', title: t('Server problem'), message: error.message })
  }
  // 404 and 422 are handled by the calling page (empty state / field errors).
}

/** Same headers as the Vue app: JSON, Accept-Language, and Authorization: Bearer when a token exists. */
export async function request(method, path, { params, body } = {}) {
  const headers = { Accept: 'application/json', 'Accept-Language': locale }
  const token = tokenStorage.get()
  if (token) headers.Authorization = `Bearer ${token}`
  const init = { method, headers }
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
    init.body = JSON.stringify(body)
  }

  let res
  try {
    res = await fetch(buildUrl(path, params), init)
  } catch {
    const error = normalizeError(0, null)
    handleError(error, path)
    throw error
  }

  let data = null
  if (res.status !== 204) {
    const text = await res.text()
    try { data = text ? JSON.parse(text) : null } catch { data = null }
  }
  if (!res.ok) {
    const error = normalizeError(res.status, data)
    handleError(error, path)
    throw error
  }
  return data
}

const api = {
  get: (path, params) => request('GET', path, { params }),
  post: (path, body) => request('POST', path, { body }),
  put: (path, body) => request('PUT', path, { body }),
  patch: (path, body) => request('PATCH', path, { body }),
  delete: (path) => request('DELETE', path),
}

export default api
