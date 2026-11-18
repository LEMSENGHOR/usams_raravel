import { beforeEach, vi } from 'vitest'

// jsdom has no <dialog>.showModal(); emulate it closely enough for the modal helpers.
HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', '') }
HTMLDialogElement.prototype.close = function () {
  if (!this.hasAttribute('open')) return
  this.removeAttribute('open')
  this.dispatchEvent(new Event('close'))
}
window.matchMedia ??= () => ({ matches: false, addEventListener() {}, removeEventListener() {} })

beforeEach(() => {
  document.body.innerHTML = '<div id="toasts"></div>'
  document.body.dataset.area = 'admin'
  document.documentElement.lang = 'en'
  document.documentElement.dataset.theme = 'light'
  history.replaceState({}, '', '/')
  localStorage.clear()
  sessionStorage.clear()
  window.USAMS = { apiBase: '/api', base: '', area: 'admin', page: '', resource: null }
  vi.restoreAllMocks()
})

/** Queue fetch responses: [{ status, body }]. Returns the fetch mock so tests can read its calls. */
export function mockFetch(...responses) {
  const queue = [...responses]
  const fn = vi.fn(async () => {
    const next = queue.length > 1 ? queue.shift() : queue[0]
    const { status = 200, body = null } = typeof next === 'function' ? next() : next
    return { ok: status >= 200 && status < 300, status, text: async () => (body === null ? '' : JSON.stringify(body)) }
  })
  vi.stubGlobal('fetch', fn)
  return fn
}

export const tick = (ms = 0) => new Promise((r) => setTimeout(r, ms))
export const flush = async () => { for (let i = 0; i < 6; i++) await tick() }

/**
 * Fake REST API. handler({ url, method, body, headers }) returns { status, body } (default 200 / null).
 * Returns the list of calls so tests can assert on exact requests.
 */
export function mockApi(handler) {
  const calls = []
  vi.stubGlobal('fetch', vi.fn(async (url, init = {}) => {
    const call = { url, method: init.method ?? 'GET', body: init.body ? JSON.parse(init.body) : undefined, headers: init.headers ?? {} }
    calls.push(call)
    const { status = 200, body = null } = (await handler(call)) ?? {}
    return { ok: status >= 200 && status < 300, status, text: async () => (body === null ? '' : JSON.stringify(body)) }
  }))
  return calls
}
