import { describe, it, expect, vi } from 'vitest'
import { mockApi, flush, tick } from './setup'
import { renderView } from './blade-lite'
import { navigate } from '@/modules/utils/nav'

const mount = (view, vars) => { document.body.insertAdjacentHTML('beforeend', renderView(view, vars)) }
const run = async (page) => { (await import(`@/pages/${page}.js`)).default(); await flush() }
const $ = (s, r = document) => r.querySelector(s)
const $$ = (s, r = document) => [...r.querySelectorAll(s)]
const byText = (sel, text, root = document) => $$(sel, root).find((n) => n.textContent.trim() === text || n.textContent.includes(text))
const type = (input, value) => { input.value = value; input.dispatchEvent(new Event('input', { bubbles: true })); input.dispatchEvent(new Event('change', { bubbles: true })) }
const paged = (rows, extra = {}) => ({ body: { data: rows, meta: { current_page: 1, last_page: 1, total: rows.length }, ...extra } })

describe('login page', () => {
  const setup = () => { mount('auth.login'); return { go: vi.spyOn(navigate, 'replace').mockImplementation(() => {}) } }

  it('validates before calling the API', async () => {
    document.body.dataset.area = 'guest'
    const { go } = setup()
    const calls = mockApi(() => ({}))
    await run('login')
    $('#login-form').dispatchEvent(new Event('submit', { cancelable: true }))
    expect($('#email-err').textContent).toBe('Enter your email address.')
    expect($('#pw-err').textContent).toBe('Enter your password.')
    type($('#email'), 'nope')
    $('#login-form').dispatchEvent(new Event('submit', { cancelable: true }))
    expect($('#email-err').textContent).toBe('Enter a valid email address.')
    expect(calls).toHaveLength(0)
    expect(go).not.toHaveBeenCalled()
  })

  it('shows invalid credentials, then recovers the button', async () => {
    const { go } = setup()
    mockApi(() => ({ status: 401, body: { message: 'Unauthenticated' } }))
    await run('login')
    type($('#email'), 'a@b.co'); type($('#password'), 'wrong')
    $('#login-form').dispatchEvent(new Event('submit', { cancelable: true }))
    await flush()
    expect($('#login-banner').hidden).toBe(false)
    expect($('#login-banner-text').textContent).toBe('Email or password is incorrect.')
    expect($('#login-submit').disabled).toBe(false)
    expect($('#login-submit').textContent).toBe('Sign in')
    expect(go).not.toHaveBeenCalled()
  })

  it('shows inactive / suspended messages from the API (403)', async () => {
    setup()
    mockApi(() => ({ body: { token: 'T', user: { role: 'LECTURER', status: 'SUSPENDED' } } }))
    await run('login')
    type($('#email'), 'a@b.co'); type($('#password'), 'x')
    $('#login-form').dispatchEvent(new Event('submit', { cancelable: true }))
    await flush()
    expect($('#login-banner-text').textContent).toMatch(/suspended/)
  })

  it('maps 422 to the field errors', async () => {
    setup()
    mockApi(() => ({ status: 422, body: { message: 'x', errors: { email: ['These credentials do not match.'] } } }))
    await run('login')
    type($('#email'), 'a@b.co'); type($('#password'), 'x')
    $('#login-form').dispatchEvent(new Event('submit', { cancelable: true }))
    await flush()
    expect($('#email-err').textContent).toBe('These credentials do not match.')
    expect($('#email').getAttribute('aria-invalid')).toBe('true')
  })

  it.each([
    ['/login?redirect=%2Fadmin%2Fstudents', 'ADMIN', '/admin/students'],
    ['/login?redirect=%2Flecturer%2Fclasses', 'ADMIN', '/admin/dashboard'], // other role's area is ignored
    ['/login?redirect=https%3A%2F%2Fevil.example', 'LECTURER', '/lecturer/dashboard'], // open redirect blocked
    ['/login', 'LECTURER', '/lecturer/dashboard'],
  ])('after sign-in %s as %s goes to %s', async (url, role, expected) => {
    history.replaceState({}, '', url)
    const { go } = setup()
    const calls = mockApi(() => ({ body: { token: 'T', user: { name: 'N', role, status: 'ACTIVE' } } }))
    await run('login')
    type($('#email'), 'a@b.co'); type($('#password'), 'secret'); $('#remember').checked = true
    $('#login-form').dispatchEvent(new Event('submit', { cancelable: true }))
    await flush()
    expect(go).toHaveBeenCalledWith(expected)
    expect(calls[0].body).toEqual({ email: 'a@b.co', password: 'secret', remember: true })
    expect(localStorage.getItem('usams_token')).toBe('T')
  })

  it('toggles password visibility and shows the expired-session notice', async () => {
    history.replaceState({}, '', '/login?reason=expired')
    setup()
    await run('login')
    expect($('#login-banner-text').textContent).toBe('Your session expired. Sign in again.')
    $('#pw-toggle').click()
    expect($('#password').type).toBe('text')
    expect($('#pw-toggle').getAttribute('aria-pressed')).toBe('true')
    $('#pw-toggle').click()
    expect($('#password').type).toBe('password')
  })
})

describe('generic resource page (faculties)', () => {
  const faculties = [{ id: 1, code: 'ENG', name: 'Engineering', description: null, status: 'ACTIVE' }, { id: 2, code: 'LAW', name: 'Law', description: 'Legal', status: 'INACTIVE' }]
  const boot = async (handler, resource = 'faculties', view = 'admin.resource') => {
    window.USAMS.resource = resource
    mount(view, { title: 'x' })
    const calls = mockApi(handler)
    await run('resource')
    return calls
  }

  it('lists records, paginates via the API and hides deactivate for inactive rows', async () => {
    const calls = await boot(() => paged(faculties))
    expect(calls[0].url).toBe('/api/faculties?page=1&per_page=15')
    const rows = $$('tbody tr')
    expect(rows).toHaveLength(2)
    expect(rows[0].textContent).toContain('Engineering')
    expect($('.st-badge-success', rows[0])).not.toBeNull()
    expect($$('button', rows[0]).map((b) => b.getAttribute('aria-label'))).toEqual(['View faculty', 'Edit faculty', 'Deactivate faculty'])
    expect($$('button', rows[1]).map((b) => b.getAttribute('aria-label'))).toEqual(['View faculty', 'Edit faculty'])
    expect($('.pg-info').textContent).toContain('2 records')
  })

  it('searches with a debounce and filters through query parameters', async () => {
    const calls = await boot(() => paged(faculties))
    type($('input[type=search]'), 'eng')
    await tick(400)
    expect(calls.at(-1).url).toBe('/api/faculties?page=1&per_page=15&search=eng')
    const select = $('select')
    type(select, 'ACTIVE')
    await flush()
    expect(calls.at(-1).url).toBe('/api/faculties?page=1&per_page=15&search=eng&status=ACTIVE')
  })

  it('creates a record: POST payload, success toast, list reload', async () => {
    const calls = await boot((c) => (c.method === 'POST' ? { status: 201, body: { data: { id: 3 } } } : paged(faculties)))
    byText('.ph-actions button', 'Add faculty').click()
    const dialog = $('dialog.fd-backdrop')
    type($('#f-code', dialog), 'MED'); type($('#f-name', dialog), 'Medicine')
    $('form', dialog).dispatchEvent(new Event('submit', { cancelable: true }))
    await flush()
    const post = calls.find((c) => c.method === 'POST')
    expect(post).toMatchObject({ url: '/api/faculties', body: { code: 'MED', name: 'Medicine', description: null, status: 'ACTIVE' } })
    expect($('#toasts').textContent).toContain('Faculty created')
    expect(calls.filter((c) => c.method === 'GET').length).toBeGreaterThanOrEqual(2)
    expect($('dialog.fd-backdrop')).toBeNull()
  })

  it('shows API validation errors inside the dialog and keeps it open', async () => {
    await boot((c) => (c.method === 'POST' ? { status: 422, body: { message: 'x', errors: { code: ['The code has already been taken.'] } } } : paged(faculties)))
    byText('.ph-actions button', 'Add faculty').click()
    const dialog = $('dialog.fd-backdrop')
    type($('#f-code', dialog), 'ENG'); type($('#f-name', dialog), 'Dup')
    $('form', dialog).dispatchEvent(new Event('submit', { cancelable: true }))
    await flush()
    expect($('#f-code', dialog).closest('.field').querySelector('.field-error').textContent).toBe('The code has already been taken.')
    expect(dialog.hasAttribute('open')).toBe(true)
  })

  it('edits with PUT and deactivates with PATCH status=INACTIVE after confirmation', async () => {
    const calls = await boot((c) => (c.method === 'GET' ? paged(faculties) : { body: { data: {} } }))
    $('[aria-label="Edit faculty"]').click()
    const dialog = $('dialog.fd-backdrop')
    expect($('#f-name', dialog).value).toBe('Engineering')
    type($('#f-name', dialog), 'Engineering & Tech')
    $('form', dialog).dispatchEvent(new Event('submit', { cancelable: true }))
    await flush()
    expect(calls.find((c) => c.method === 'PUT')).toMatchObject({ url: '/api/faculties/1', body: { code: 'ENG', name: 'Engineering & Tech', description: null, status: 'ACTIVE' } })

    $('[aria-label="Deactivate faculty"]').click()
    expect($('#cd-title').textContent).toBe('Deactivate this faculty?')
    $('#cd-confirm').click()
    await flush()
    expect(calls.find((c) => c.method === 'PATCH')).toMatchObject({ url: '/api/faculties/1', body: { status: 'INACTIVE' } })
    expect($('#toasts').textContent).toContain('Faculty deactivated')
  })

  it('keeps the confirm dialog open and shows the server message when deactivating fails', async () => {
    await boot((c) => (c.method === 'PATCH' ? { status: 403, body: { message: 'Not permitted' } } : paged(faculties)))
    $('[aria-label="Deactivate faculty"]').click()
    $('#cd-confirm').click()
    await flush()
    expect($('#confirm-dialog').hasAttribute('open')).toBe(true)
    expect($('#toasts').textContent).toContain('Not permitted')
  })

  it('opens the details dialog', async () => {
    await boot(() => paged(faculties))
    $('[aria-label="View faculty"]').click()
    const dd = $('dialog.dd-backdrop')
    expect(dd.textContent).toContain('Engineering')
    expect($('h2', dd).textContent).toBe('Faculty details')
  })

  it('shows an error state with retry, then the table', async () => {
    let fail = true
    const calls = await boot(() => (fail ? { status: 500 } : paged(faculties)))
    expect($('.er-error')).not.toBeNull()
    fail = false
    $('.er-btn').click()
    await flush()
    expect($$('tbody tr')).toHaveLength(2)
    expect(calls.filter((c) => c.method === 'GET')).toHaveLength(2)
  })

  it('empty list offers to add the first record', async () => {
    await boot(() => paged([]))
    expect($('.es-empty h2').textContent).toBe('No faculties found')
    expect($('.es-empty').textContent).toContain('Add the first faculty to get started.')
    expect($('.es-slot button')).not.toBeNull()
  })

  it('read-only list (attendance records) has no add button and no action column', async () => {
    await boot(() => paged([{ id: 1, status: 'PRESENT', session: { session_date: '2026-11-05', class: { name: 'CS' }, subject: { name: 'Algo' }, lecturer: { name: 'L' } }, student: { student_code: 'S1', name: 'Sok' } }]), 'adminRecords')
    expect($('.ph-actions button')).toBeNull()
    expect($$('thead th')).toHaveLength(7)
    expect($('.st-badge-success').textContent).toBe('Present')
  })

  it('link-style list (lecturer classes) renders links to the class page', async () => {
    window.USAMS.area = 'lecturer'
    await boot(() => paged([{ id: 5, class: { name: 'CS-1' }, subject: { name: 'Algo' }, semester: { name: 'S1' }, room: 'A1', status: 'ACTIVE' }]), 'lecturerClasses', 'lecturer.resource')
    expect($('tbody a').getAttribute('href')).toBe('/lecturer/classes/5')
  })

  it('user accounts: password required on create, optional on edit', async () => {
    const calls = await boot((c) => (c.method === 'GET' ? paged([{ id: 1, name: 'A', email: 'a@b.co', role: 'ADMIN', status: 'ACTIVE' }]) : { body: { data: {} } }), 'users')
    $('[aria-label="Edit user account"]').click()
    const dialog = $('dialog.fd-backdrop')
    expect(dialog.querySelectorAll('#f-password')).toHaveLength(1)
    $('form', dialog).dispatchEvent(new Event('submit', { cancelable: true }))
    await flush()
    expect(calls.find((c) => c.method === 'PUT').body).toEqual({ name: 'A', email: 'a@b.co', role: 'ADMIN', status: 'ACTIVE' })
  })
})

describe('lecturer sessions page', () => {
  const sessions = [
    { id: 1, status: 'SCHEDULED', session_date: '2026-11-05', class: { name: 'CS-1' }, subject: { name: 'Algo' }, start_time: '08:00:00', end_time: '09:30:00' },
    { id: 2, status: 'OPEN', session_date: '2026-11-05', class: { name: 'CS-2' }, subject: { name: 'Data' }, start_time: '10:00:00', end_time: '11:30:00' },
    { id: 3, status: 'CLOSED', session_date: '2026-11-04', class: { name: 'CS-3' }, subject: { name: 'Net' }, start_time: '10:00:00', end_time: '11:30:00' },
  ]
  const boot = async (handler) => { window.USAMS.area = 'lecturer'; mount('lecturer.sessions'); const calls = mockApi(handler); await run('lecturer-sessions'); return calls }

  it('offers only the actions each status allows', async () => {
    await boot(() => paged(sessions))
    const actions = $$('tbody tr').map((tr) => $$('.btn', tr).map((b) => b.textContent.trim()))
    expect(actions).toEqual([['Open', 'Cancel', 'View'], ['Take attendance', 'Close'], ['View']])
    expect($$('tbody tr')[1].querySelector('a.btn-primary').getAttribute('href')).toBe('/lecturer/attendance/sessions/2')
  })

  it('opens a scheduled session after confirmation (POST …/open)', async () => {
    const calls = await boot((c) => (c.method === 'GET' ? paged(sessions) : { body: {} }))
    byText('tbody tr:first-child button', 'Open').click()
    expect($('#cd-title').textContent).toBe('Open this session?')
    $('#cd-confirm').click()
    await flush()
    expect(calls.find((c) => c.method === 'POST')).toMatchObject({ url: '/api/lecturer/attendance-sessions/1/open' })
    expect($('#toasts').textContent).toContain('Session opened')
  })

  it('cancelling asks for a danger confirmation; close hits the close endpoint', async () => {
    const calls = await boot((c) => (c.method === 'GET' ? paged(sessions) : { body: {} }))
    byText('tbody tr:first-child button', 'Cancel').click()
    expect($('#cd-confirm').className).toContain('btn-danger')
    $('#cd-cancel').click()
    await flush()
    expect(calls.some((c) => c.method === 'POST')).toBe(false)

    byText('tbody tr:nth-child(2) button', 'Close').click()
    $('#cd-confirm').click()
    await flush()
    expect(calls.find((c) => c.method === 'POST').url).toBe('/api/lecturer/attendance-sessions/2/close')
  })

  it('creates a session from an assigned class-subject (numeric id kept as a number)', async () => {
    const assignments = [{ id: 11, class: { name: 'CS-1' }, subject: { name: 'Algo' }, semester: { name: 'S1' } }]
    const calls = await boot((c) => (c.url.includes('class-subjects') ? paged(assignments) : c.method === 'POST' ? { status: 201, body: { data: {} } } : paged(sessions)))
    $('#btn-new-session').click()
    await flush()
    const dialog = $('dialog.fd-backdrop')
    expect($('#f-class_subject_id', dialog).options[1].textContent).toBe('CS-1 · Algo · S1')
    type($('#f-class_subject_id', dialog), '11'); type($('#f-session_date', dialog), '2026-11-06')
    type($('#f-start_time', dialog), '08:00'); type($('#f-end_time', dialog), '09:30')
    $('form', dialog).dispatchEvent(new Event('submit', { cancelable: true }))
    await flush()
    expect(calls.find((c) => c.method === 'POST')).toMatchObject({ url: '/api/lecturer/attendance-sessions', body: { class_subject_id: 11, session_date: '2026-11-06', start_time: '08:00', end_time: '09:30' } })
  })
})
