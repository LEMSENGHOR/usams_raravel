import { describe, it, expect, vi } from 'vitest'
import { mockApi, flush } from './setup'
import api, { normalizeError } from '@/api/client'
import { tokenStorage } from '@/modules/utils/tokenStorage'
import { navigate } from '@/modules/utils/nav'

const $toast = () => document.querySelector('#toasts .tc-toast')

describe('api client', () => {
  it('sends Bearer token, JSON accept header and language; builds the query string', async () => {
    tokenStorage.set('abc123', false)
    const calls = mockApi(() => ({ body: { data: [] } }))
    await api.get('/faculties', { page: 2, search: '', skip: null, status: 'ACTIVE' })
    expect(calls[0].url).toBe('/api/faculties?page=2&status=ACTIVE')
    expect(calls[0].headers).toMatchObject({ Authorization: 'Bearer abc123', Accept: 'application/json', 'Accept-Language': 'en' })
  })

  it('sends JSON bodies with the right method and content type', async () => {
    const calls = mockApi(() => ({ body: { ok: true } }))
    await api.post('/faculties', { code: 'ENG' })
    await api.put('/faculties/1', { name: 'X' })
    await api.patch('/faculties/1', { status: 'INACTIVE' })
    await api.delete('/faculties/1')
    expect(calls.map((c) => c.method)).toEqual(['POST', 'PUT', 'PATCH', 'DELETE'])
    expect(calls[0].body).toEqual({ code: 'ENG' })
    expect(calls[0].headers['Content-Type']).toBe('application/json')
    expect(calls[3].headers['Content-Type']).toBeUndefined()
  })

  it('returns null for 204', async () => {
    mockApi(() => ({ status: 204 }))
    expect(await api.delete('/x/1')).toBeNull()
  })

  it('maps 422 to fieldErrors without a toast', async () => {
    mockApi(() => ({ status: 422, body: { message: 'Invalid', errors: { email: ['Taken'] } } }))
    await expect(api.post('/users', {})).rejects.toMatchObject({ status: 422, message: 'Invalid', fieldErrors: { email: ['Taken'] } })
    expect($toast()).toBeNull()
  })

  it('401 clears the token and redirects to login with the current page', async () => {
    tokenStorage.set('abc', true)
    const go = vi.spyOn(navigate, 'replace').mockImplementation(() => {})
    mockApi(() => ({ status: 401, body: { message: 'Unauthenticated.' } }))
    await expect(api.get('/users')).rejects.toMatchObject({ status: 401 })
    expect(tokenStorage.get()).toBeNull()
    expect(go).toHaveBeenCalledWith(expect.stringMatching(/^\/login\?redirect=.*&reason=expired$/))
  })

  it('401 from the login call itself is not treated as an expired session', async () => {
    tokenStorage.set('abc', true)
    const go = vi.spyOn(navigate, 'replace').mockImplementation(() => {})
    mockApi(() => ({ status: 401, body: { message: 'Bad credentials' } }))
    await expect(api.post('/auth/login', {})).rejects.toMatchObject({ status: 401, message: 'Bad credentials' })
    expect(tokenStorage.get()).toBe('abc')
    expect(go).not.toHaveBeenCalled()
  })

  it('403 shows a toast; 500 and network failures show a server toast', async () => {
    mockApi(() => ({ status: 403, body: { message: 'Forbidden for you' } }))
    await expect(api.get('/users')).rejects.toMatchObject({ status: 403 })
    expect($toast().textContent).toContain('Not allowed')
    expect($toast().textContent).toContain('Forbidden for you')

    document.querySelector('#toasts').innerHTML = ''
    mockApi(() => ({ status: 500 }))
    await expect(api.get('/users')).rejects.toMatchObject({ status: 500 })
    expect($toast().textContent).toContain('Server problem')

    document.querySelector('#toasts').innerHTML = ''
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch') }))
    await expect(api.get('/users')).rejects.toMatchObject({ status: 0 })
    expect($toast().textContent).toContain('Cannot reach the server')
  })

  it('normalizeError falls back to readable messages', () => {
    expect(normalizeError(404, null).message).toMatch(/not found/i)
    expect(normalizeError(422, {}).message).toMatch(/invalid/i)
    expect(normalizeError(418, null).message).toMatch(/went wrong/i)
  })
})
