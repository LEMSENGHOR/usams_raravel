import { describe, it, expect, vi } from 'vitest'
import { mockApi } from './setup'

// vi.resetModules() also resets the nav module, so spy on the instance the fresh auth module uses.
async function freshAuth() {
  vi.resetModules()
  const auth = await import('@/modules/auth')
  const { navigate } = await import('@/modules/utils/nav')
  return Object.assign(auth, { navigate })
}

describe('auth module', () => {
  it('logs in, stores the token for the session only, and returns the role home', async () => {
    const calls = mockApi(() => ({ body: { token: 'T1', user: { id: 1, name: 'Dara', role: 'LECTURER', status: 'ACTIVE' } } }))
    const auth = await freshAuth()
    const home = await auth.login({ email: 'a@b.c', password: 'x', remember: false })
    expect(home).toBe('/lecturer/dashboard')
    expect(sessionStorage.getItem('usams_token')).toBe('T1')
    expect(localStorage.getItem('usams_token')).toBeNull()
    expect(calls[0]).toMatchObject({ method: 'POST', url: '/api/auth/login', body: { email: 'a@b.c', password: 'x', remember: false } })
  })

  it('remember me keeps the token in localStorage; admins go to the admin dashboard', async () => {
    mockApi(() => ({ body: { data: { token: 'T2', user: { name: 'A', role: 'SUPER_ADMIN' } } } }))
    const auth = await freshAuth()
    expect(await auth.login({ email: 'a@b.c', password: 'x', remember: true })).toBe('/admin/dashboard')
    expect(localStorage.getItem('usams_token')).toBe('T2')
  })

  it.each([['SUSPENDED', /suspended/], ['INACTIVE', /inactive/]])('refuses a %s account and keeps no session', async (status, re) => {
    const calls = mockApi(() => ({ body: { token: 'T', user: { role: 'ADMIN', status } } }))
    const auth = await freshAuth()
    await expect(auth.login({ email: 'a', password: 'b' })).rejects.toMatchObject({ status: 403, message: expect.stringMatching(re) })
    expect(sessionStorage.getItem('usams_token')).toBeNull()
    expect(auth.getUser()).toBeNull()
    expect(calls.some((c) => c.url === '/api/auth/logout')).toBe(true) // revoke the token that was just issued
  })

  it('students have no dashboard', async () => {
    mockApi(() => ({ body: { token: 'T', user: { role: 'STUDENT', status: 'ACTIVE' } } }))
    const auth = await freshAuth()
    await expect(auth.login({ email: 'a', password: 'b' })).rejects.toMatchObject({ code: 'NO_DASHBOARD' })
  })

  it('guard: sends visitors to login, wrong roles to forbidden, signed-in users away from login', async () => {
    mockApi(() => ({ body: { data: { name: 'L', role: 'LECTURER', status: 'ACTIVE' } } }))

    let auth = await freshAuth()
    const go = vi.spyOn(auth.navigate, 'replace').mockImplementation(() => {})
    expect(await auth.guard('admin')).toBe(false)
    expect(go).toHaveBeenLastCalledWith(expect.stringContaining('/login?redirect='))
    expect(await auth.guard('guest')).toBe(true)

    sessionStorage.setItem('usams_token', 'T')
    auth = await freshAuth()
    const go2 = vi.spyOn(auth.navigate, 'replace').mockImplementation(() => {})
    expect(await auth.guard('admin')).toBe(false)
    expect(go2).toHaveBeenLastCalledWith('/forbidden')
    expect(await auth.guard('lecturer')).toBe(true)
    expect(await auth.guard('guest')).toBe(false)
    expect(go2).toHaveBeenLastCalledWith('/lecturer/dashboard')
    expect(await auth.guard('any')).toBe(true)
  })

  it('an expired or invalid stored token is cleared on restore', async () => {
    sessionStorage.setItem('usams_token', 'old')
    mockApi(() => ({ status: 401, body: { message: 'Unauthenticated.' } }))
    const auth = await freshAuth()
    vi.spyOn(auth.navigate, 'replace').mockImplementation(() => {})
    await auth.restore()
    expect(auth.getUser()).toBeNull()
    expect(sessionStorage.getItem('usams_token')).toBeNull()
  })

  it('logout clears the session even if the API call fails', async () => {
    sessionStorage.setItem('usams_token', 'T')
    mockApi(() => ({ status: 500 }))
    const auth = await freshAuth()
    await auth.logout()
    expect(sessionStorage.getItem('usams_token')).toBeNull()
  })
})

describe('i18n', () => {
  it('translates to Khmer with placeholders and records missing keys', async () => {
    document.documentElement.lang = 'km'
    vi.resetModules()
    const { t, tl, tc, missing, locale } = await import('@/modules/i18n')
    expect(locale).toBe('km')
    expect(t('Save attendance')).toBe('រក្សាទុកវត្តមាន')
    expect(t('Page {page} of {last}', { page: 2, last: 5 })).toBe('ទំព័រ 2 នៃ 5')
    expect(tl('Statuses')).toBe('ស្ថានភាព')
    expect(tc('faculty')).toBe('មហាវិទ្យាល័យ')
    expect(t('Some server message')).toBe('Some server message')
    expect(missing.has('Some server message')).toBe(true)
    expect(t('សួស្តី')).toBe('សួស្តី')
    expect(missing.has('សួស្តី')).toBe(false) // already Khmer
  })

  it('stays English by default', async () => {
    vi.resetModules()
    const { t, tl, tc } = await import('@/modules/i18n')
    expect(t('Save attendance')).toBe('Save attendance')
    expect(tl('Statuses')).toBe('statuses')
    expect(tc('faculty')).toBe('Faculty')
  })
})
