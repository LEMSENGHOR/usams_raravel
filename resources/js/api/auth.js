import api from './client'
import { endpoints } from '@/modules/config/endpoints'

// Laravel resources often wrap payloads in `data`. Unwrap once, here.
const unwrap = (body) => body?.data ?? body

export const authApi = {
  async login({ email, password, remember }) {
    const body = unwrap(await api.post(endpoints.auth.login, { email, password, remember }))
    // Expected (verify with the real controller): { token, user } or the user itself with a token field.
    return { token: body.token ?? body.access_token ?? null, user: body.user ?? body }
  },

  async me() {
    const body = unwrap(await api.get(endpoints.auth.me))
    return body.user ?? body
  },

  async logout() {
    await api.post(endpoints.auth.logout)
  },
}
