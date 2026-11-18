// Token mode only. "Remember me" -> localStorage, otherwise sessionStorage.
const KEY = 'usams_token'

export const tokenStorage = {
  get() {
    return localStorage.getItem(KEY) || sessionStorage.getItem(KEY)
  },
  set(token, remember) {
    this.clear()
    ;(remember ? localStorage : sessionStorage).setItem(KEY, token)
  },
  clear() {
    localStorage.removeItem(KEY)
    sessionStorage.removeItem(KEY)
  },
}
