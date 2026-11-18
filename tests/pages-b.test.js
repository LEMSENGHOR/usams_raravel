import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockApi, flush, tick } from './setup'
import { renderView, renderPartial } from './blade-lite'
import { dirtyGuard } from '@/modules/shell'
import { features } from '@/modules/config/endpoints'

const mount = (view, vars) => { document.body.insertAdjacentHTML('beforeend', renderView(view, vars)) }
const run = async (page) => { (await import(`@/pages/${page}.js`)).default(); await flush() }
const $ = (s, r = document) => r.querySelector(s)
const $$ = (s, r = document) => [...r.querySelectorAll(s)]
const byText = (sel, text, root = document) => $$(sel, root).find((n) => n.textContent.includes(text))
const type = (input, value) => { input.value = value; input.dispatchEvent(new Event('input', { bubbles: true })); input.dispatchEvent(new Event('change', { bubbles: true })) }
const submit = (form) => form.dispatchEvent(new Event('submit', { cancelable: true }))
const paged = (rows) => ({ body: { data: rows, meta: { current_page: 1, last_page: 1, total: rows.length } } })

beforeEach(() => { dirtyGuard.leaving = false; dirtyGuard.dispose?.(); features.markAllPresent = false; features.passwordChange = false })

// ---------------------------------------------------------------------------------------------
describe('attendance sheet (lecturer)', () => {
  const base = '/api/lecturer/attendance-sessions/7'
  const session = (status = 'OPEN') => ({ id: 7, status, session_date: '2026-11-05', start_time: '08:00:00', end_time: '09:30:00', class: { name: 'CS-1' }, subject: { name: 'Algorithms' } })
  const records = [
    { student: { id: 1, student_code: 'S001', name: 'Sok' }, record: null },
    { student: { id: 2, student_code: 'S002', name: 'Dara' }, record: { status: 'LATE', check_in_time: '08:10:00' } },
    { student: { id: 3, student_code: 'S003', name: 'Bopha' }, record: null },
  ]
  const api = (status = 'OPEN', extra = () => undefined) => (c) =>
    extra(c) ?? (c.url === base ? { body: { data: session(status) } } : c.url.startsWith(`${base}/records`) && c.method === 'GET' ? { body: { data: records } } : { body: {} })
  const boot = async (handler, status = 'OPEN') => {
    window.USAMS.area = 'lecturer'
    mount('lecturer.attendance-sheet', { sessionId: '7' })
    const calls = mockApi(handler ?? api(status))
    await run('attendance-sheet')
    return calls
  }
  const radios = (row) => $$('[role=radio]', row)
  const rowOf = (name) => $$('tbody tr').find((tr) => tr.textContent.includes(name))

  it('shows header, details, counts, and keeps unmarked students unmarked (no invented status)', async () => {
    const calls = await boot()
    expect(calls.map((c) => c.url)).toEqual([base, `${base}/records?per_page=500`])
    expect($('h1').textContent).toBe('CS-1 · Algorithms')
    expect($('.as-meta').textContent).toContain('08:00 – 09:30')
    expect($('.as-meta').textContent).toContain('3') // students
    expect($('.as-chips').textContent.replace(/\s+/g, ' ')).toContain('Present 0 Late 1 Absent 0 Excused 0 Not marked 2')
    expect(radios(rowOf('Sok')).every((r) => r.getAttribute('aria-checked') === 'false')).toBe(true)
    expect(radios(rowOf('Dara')).find((r) => r.dataset.value === 'LATE').getAttribute('aria-checked')).toBe('true')
    expect(rowOf('Dara').textContent).toContain('08:10')
    expect($('.as-hint')).toBeNull()
    expect(byText('.ph-actions button', 'Save')).toBeUndefined()
    expect(byText('button', 'Save attendance').disabled).toBe(true)
    expect(byText('button', 'Mark all present')).toBeUndefined() // only if the backend supports it
  })

  it('tracks unsaved changes, then saves only the changed students', async () => {
    const calls = await boot()
    radios(rowOf('Sok')).find((r) => r.dataset.value === 'PRESENT').click()
    expect(byText('button', 'Save attendance').textContent).toContain('Save attendance (1)')
    expect(byText('button', 'Save attendance').disabled).toBe(false)
    expect(byText('.ph-actions button', 'Close session').disabled).toBe(true)
    expect(byText('.ph-actions button', 'Close session').title).toBe('Save your changes before closing')
    expect($('.as-chips').textContent.replace(/\s+/g, ' ')).toContain('Present 1 Late 1 Absent 0 Excused 0 Not marked 1')

    // changing Dara's existing LATE record counts too
    radios(rowOf('Dara')).find((r) => r.dataset.value === 'EXCUSED').click()
    byText('button', 'Save attendance').click()
    await flush()
    const put = calls.find((c) => c.method === 'PUT')
    expect(put.url).toBe(`${base}/records`)
    expect(put.body).toEqual({ records: [{ student_id: 1, status: 'PRESENT' }, { student_id: 2, status: 'EXCUSED' }] })
    expect($('#toasts').textContent).toContain('Attendance saved for 2 students')
    expect(calls.filter((c) => c.method === 'GET').length).toBe(4) // reloaded after saving
  })

  it('keeps the changes and reports the failure when saving fails', async () => {
    await boot(api('OPEN', (c) => (c.method === 'PUT' ? { status: 403, body: { message: 'Session is locked' } } : undefined)))
    radios(rowOf('Sok')).find((r) => r.dataset.value === 'ABSENT').click()
    byText('button', 'Save attendance').click()
    await flush()
    expect($('#toasts').textContent).toContain('Attendance was not saved')
    expect($('#toasts').textContent).toContain('Session is locked')
    expect(byText('button', 'Save attendance').textContent).toContain('(1)')
    expect(byText('button', 'Save attendance').disabled).toBe(false)
  })

  it('filters by name/code and by status, including "Not marked"', async () => {
    await boot()
    type($('input[type=search]'), 's002')
    expect($$('tbody tr')).toHaveLength(1)
    type($('input[type=search]'), '')
    type($('select.as-sel'), 'NONE')
    expect($$('tbody tr').map((r) => r.textContent.includes('Dara'))).toEqual([false, false])
    type($('select.as-sel'), 'ABSENT')
    expect($('.es-empty h2').textContent).toBe('No students match')
  })

  it('closes the session after a confirmation that mentions unmarked students', async () => {
    const calls = await boot()
    byText('.ph-actions button', 'Close session').click()
    expect($('#cd-msg').textContent).toContain('2 of 3 students are not marked')
    $('#cd-confirm').click()
    await flush()
    expect(calls.find((c) => c.method === 'POST').url).toBe(`${base}/close`)
    expect($('#toasts').textContent).toContain('Session closed')
  })

  it('scheduled session: shows Open/Cancel and a hint, no marking controls; Open posts immediately', async () => {
    const calls = await boot(undefined, 'SCHEDULED')
    expect($('.as-hint').textContent).toBe('Open the session to start marking attendance.')
    expect($$('[role=radio]')).toHaveLength(0)
    expect(byText('.ph-actions button', 'Cancel session')).not.toBeUndefined()
    byText('.ph-actions button', 'Open session').click()
    await flush()
    expect(calls.find((c) => c.method === 'POST').url).toBe(`${base}/open`)
  })

  it('closed session is read-only with badges', async () => {
    await boot(undefined, 'CLOSED')
    expect($$('[role=radio]')).toHaveLength(0)
    expect($('.as-hint').textContent).toBe('This session is closed. Attendance is read-only.')
    expect($$('tbody .st-badge').map((b) => b.textContent)).toEqual(['Not marked', 'Late', 'Not marked'])
    expect($('.ph-actions button')).toBeNull()
  })

  it('mark-all-present is available only when enabled, needs confirmation, and still requires Save', async () => {
    features.markAllPresent = true
    const calls = await boot()
    byText('button', 'Mark all present').click()
    expect($('#cd-msg').textContent).toContain('2 students without a status')
    $('#cd-confirm').click()
    await flush()
    expect(radios(rowOf('Sok')).find((r) => r.dataset.value === 'PRESENT').getAttribute('aria-checked')).toBe('true')
    expect(radios(rowOf('Dara')).find((r) => r.dataset.value === 'LATE').getAttribute('aria-checked')).toBe('true') // untouched
    expect(calls.some((c) => c.method === 'PUT')).toBe(false)
    expect(byText('button', 'Save attendance').textContent).toContain('(2)')
  })

  it('protects unsaved work when following a link or leaving the page', async () => {
    await boot()
    radios(rowOf('Sok')).find((r) => r.dataset.value === 'PRESENT').click()
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
    document.body.insertAdjacentHTML('beforeend', '<a id="nav" href="/lecturer/classes">x</a>')
    const click = new MouseEvent('click', { bubbles: true, cancelable: true })
    $('#nav').dispatchEvent(click)
    expect(confirm).toHaveBeenCalled()
    expect(click.defaultPrevented).toBe(true)
    const unload = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(unload)
    expect(unload.defaultPrevented).toBe(true)
    expect(dirtyGuard.check()).toBe(true)
  })

  it('shows an error state with retry when the session cannot be loaded', async () => {
    let fail = true
    await boot((c) => (fail ? { status: 403, body: { message: 'Not your session' } } : api()(c)))
    expect($('#sheet-root').textContent).toContain('Not your session')
    fail = false
    $('.er-btn').click()
    await flush()
    expect($('h1').textContent).toBe('CS-1 · Algorithms')
  })

  it('admin view uses the admin endpoint and is read-only', async () => {
    window.USAMS.area = 'admin'
    document.body.dataset.area = 'admin'
    mount('admin.session', { sessionId: '7' })
    const calls = mockApi((c) => (c.url === '/api/attendance-sessions/7' ? { body: { data: session('OPEN') } } : c.url.startsWith('/api/attendance-sessions/7/records') ? { body: { data: records } } : {}))
    await run('attendance-sheet')
    expect(calls[0].url).toBe('/api/attendance-sessions/7')
    expect($$('[role=radio]')).toHaveLength(0)
    expect($('.as-hint').textContent).toBe('This session is open. Attendance is read-only.')
    expect(byText('button', 'Save attendance')).toBeUndefined()
    expect($('#back-link').getAttribute('href')).toBe('/admin/attendance/sessions')
  })
})

// ---------------------------------------------------------------------------------------------
describe('dashboards', () => {
  it('admin: fills figures from the API, "—" for anything missing, never an invented number', async () => {
    window.USAMS.area = 'admin'
    mount('admin.dashboard')
    mockApi(() => ({ body: { data: {
      stats: { total_students: 120, total_lecturers: 0 }, active_classes: 30, attendance_rate: 91.234,
      attendance_overview: [{ label: 'Mon', present: 9, late: 1, absent: 0, excused: 0 }],
      recent_sessions: [{ id: 1, class: { name: 'CS-1' }, subject: { name: 'Algo' }, session_date: '2026-11-05', status: 'OPEN' }],
      recent_students: [{ id: 1, name: 'Sok', created_at: '2026-11-01' }], current_academic_year: { name: '2026-2027' }, current_semester: { name: 'Semester 1' },
    } } }))
    ;(await import('@/pages/dashboard-admin.js')).default()
    expect($('[data-stat=total_students] [data-skeleton]').hidden).toBe(false) // loading state first
    await flush()
    const value = (k) => $(`[data-stat=${k}] [data-value]`)
    expect(value('total_students').textContent).toBe('120')
    expect(value('total_lecturers').textContent).toBe('0')
    expect(value('active_classes').textContent).toBe('30')
    expect(value('attendance_rate').textContent).toBe('91.2%')
    expect(value('active_subjects').textContent).toBe('—')
    expect(value('attendance_sessions').textContent).toBe('—')
    expect(value('total_students').hidden).toBe(false)
    expect($('#dash-overview .ch-col')).not.toBeNull()
    expect($('#dash-year').textContent).toContain('2026-2027')
    expect($('#dash-sessions .st-badge-success').textContent).toBe('Open')
    expect($('#dash-people').textContent).toContain('Sok')
  })

  it('admin: shows an error state with retry and hides the figures', async () => {
    window.USAMS.area = 'admin'
    mount('admin.dashboard')
    let fail = true
    mockApi(() => (fail ? { status: 500 } : { body: { stats: { total_students: 5 } } }))
    await run('dashboard-admin')
    expect($('#dash-error').hidden).toBe(false)
    expect($('#dash-content').hidden).toBe(true)
    fail = false
    $('#dash-error .er-btn').click()
    await flush()
    expect($('#dash-content').hidden).toBe(false)
    expect($('[data-stat=total_students] [data-value]').textContent).toBe('5')
  })

  it('admin: empty data shows friendly empty states', async () => {
    window.USAMS.area = 'admin'
    mount('admin.dashboard')
    mockApi(() => ({ body: { data: {} } }))
    await run('dashboard-admin')
    expect($('#dash-overview').textContent).toContain('No attendance data yet')
    expect($('#dash-year').textContent).toContain('None active')
    expect($('#dash-sessions').textContent).toContain('No sessions yet')
  })

  it('lecturer: today count, lists, rates and rooms', async () => {
    window.USAMS.area = 'lecturer'
    mount('lecturer.dashboard')
    const calls = mockApi(() => ({ body: { data: {
      assigned_classes: 4, assigned_subjects: 3, sessions_opened_today: 1,
      today_classes: [{ id: 1, class: { name: 'CS-1' }, subject: { name: 'Algo' }, start_time: '08:00:00', end_time: '09:30:00', room: 'A1' }],
      upcoming_timetable: [{ id: 2, day_of_week: 'FRIDAY', class: { name: 'CS-2' }, subject: { name: 'Data' }, start_time: '10:00:00', end_time: '11:00:00' }],
      class_summaries: [{ class: { name: 'CS-1' }, subject: { name: 'Algo' }, attendance_rate: 87.5 }],
    } } }))
    await run('dashboard-lecturer')
    expect(calls[0].url).toBe('/api/lecturer/dashboard')
    expect($('#welcome-title').textContent).toBe('Welcome, Lecturer')
    expect($('[data-stat=today_classes] [data-value]').textContent).toBe('1')
    expect($('[data-stat=assigned_classes] [data-value]').textContent).toBe('4')
    expect($('#dash-today').textContent).toContain('Room A1')
    expect($('#dash-upcoming').textContent).toContain('Friday')
    expect($('#dash-summaries').textContent).toContain('87.5%')
    expect($('#dash-sessions').textContent).toContain('No sessions yet')
  })
})

// ---------------------------------------------------------------------------------------------
describe('timetable', () => {
  const entries = [
    { id: 1, day_of_week: 'MONDAY', start_time: '10:00:00', end_time: '11:30:00', room: 'B2', class: { name: 'CS-1' }, subject: { name: 'Data' }, lecturer: { name: 'Dr. Lim' } },
    { id: 2, day_of_week: 'MONDAY', start_time: '08:00:00', end_time: '09:30:00', room: 'A1', class: { name: 'CS-1' }, subject: { name: 'Algo' }, lecturer: { name: 'Dr. Lim' } },
    { id: 3, day_of_week: 'WEDNESDAY', start_time: '08:00:00', end_time: '09:30:00', class: { name: 'CS-2' }, subject: { name: 'Net' } },
  ]
  const bootAdmin = async (handler) => { window.USAMS.area = 'admin'; mount('admin.timetable'); const calls = mockApi(handler); await run('timetable'); return calls }

  it('groups entries by weekday in time order and hides empty weekend days', async () => {
    const calls = await bootAdmin(() => paged(entries))
    expect(calls.find((c) => c.url.startsWith('/api/timetables')).url).toBe('/api/timetables?per_page=200')
    const days = $$('.tp-day').map((d) => $('h2', d).textContent)
    expect(days).toEqual(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'])
    expect($$('.tp-day')[0].textContent.indexOf('08:00')).toBeLessThan($$('.tp-day')[0].textContent.indexOf('10:00'))
    expect($$('.tp-day')[1].textContent).toContain('No classes')
    expect($$('.tp-day')[0].textContent).toContain('Room A1')
  })

  it('filters by class through the API', async () => {
    const calls = await bootAdmin((c) => (c.url.startsWith('/api/classes') ? paged([{ id: 3, name: 'CS-1' }]) : paged(entries)))
    type($('#tp-filter select'), '3')
    await flush()
    expect(calls.at(-1).url).toBe('/api/timetables?per_page=200&class_id=3')
  })

  it('adds an entry (numeric class-subject id) and shows backend conflict errors', async () => {
    let conflict = true
    const calls = await bootAdmin((c) => {
      if (c.url.startsWith('/api/class-subjects')) return paged([{ id: 11, class: { name: 'CS-1' }, subject: { name: 'Algo' }, semester: { name: 'S1' } }])
      if (c.method === 'POST') return conflict ? { status: 422, body: { message: 'x', errors: { start_time: ['Room A1 is already booked at this time.'] } } } : { status: 201, body: { data: {} } }
      return paged(entries)
    })
    byText('.ph-actions button', 'Add entry').click()
    await flush()
    const dialog = $('dialog.fd-backdrop')
    type($('#f-class_subject_id', dialog), '11'); type($('#f-day_of_week', dialog), 'MONDAY')
    type($('#f-start_time', dialog), '08:00'); type($('#f-end_time', dialog), '09:30')
    submit($('form', dialog)); await flush()
    expect($('#f-start_time', dialog).closest('.field').querySelector('.field-error').textContent).toBe('Room A1 is already booked at this time.')
    conflict = false
    submit($('form', dialog)); await flush()
    expect(calls.filter((c) => c.method === 'POST').at(-1).body).toEqual({ class_subject_id: 11, day_of_week: 'MONDAY', start_time: '08:00', end_time: '09:30', room: null })
    expect($('#toasts').textContent).toContain('Timetable entry added')
  })

  it('edits and deletes entries', async () => {
    const calls = await bootAdmin((c) => (c.url.startsWith('/api/class-subjects') ? paged([]) : c.method === 'GET' ? paged(entries) : { body: {} }))
    $('[aria-label="Delete entry 10:00"]').click()
    expect($('#cd-title').textContent).toBe('Delete this entry?')
    $('#cd-confirm').click(); await flush()
    expect(calls.find((c) => c.method === 'DELETE').url).toBe('/api/timetables/1')
    $('[aria-label="Edit entry 08:00"]').click()
    expect($('dialog.fd-backdrop h2').textContent).toBe('Edit timetable entry')
  })

  it('lecturers get a read-only view of their own timetable', async () => {
    window.USAMS.area = 'lecturer'
    mount('lecturer.timetable')
    const calls = mockApi(() => paged(entries))
    await run('timetable')
    expect(calls[0].url).toBe('/api/lecturer/timetables?per_page=200')
    expect($('.ph-actions button')).toBeNull()
    expect($$('.tp-entry button')).toHaveLength(0)
  })

  it('empty and error states', async () => {
    let state = 'empty'
    await bootAdmin(() => (state === 'empty' ? paged([]) : { status: 500 }))
    expect($('.tp-empty').textContent).toBe('No timetable entries yet.')
  })
})

// ---------------------------------------------------------------------------------------------
describe('reports', () => {
  const report = { data: { summary: { attendance_rate: 88.55, present: 80, late: 5, absent: 10, excused: 5 },
    rows: [{ label: 'Sok', total: 20, present: 18, late: 1, absent: 1, excused: 0, attendance_rate: 90 }, { label: '=cmd|x', total: 4, present: 4, late: 0, absent: 0, excused: 0, attendance_rate: 100 }] } }

  const readBytes = (blob) => new Promise((res) => { const r = new FileReader(); r.onload = () => res(new Uint8Array(r.result)); r.readAsArrayBuffer(blob) })

  it('admin: generates with the chosen filters and group, shows figures, and exports a safe CSV', async () => {
    window.USAMS.area = 'admin'
    mount('admin.reports')
    const calls = mockApi((c) => (c.url.startsWith('/api/classes') ? paged([{ id: 3, name: 'CS-1' }]) : c.url.startsWith('/api/reports') ? { body: report } : paged([])))
    await run('reports')
    expect($('#report-result').textContent).toContain('No report yet')
    expect($$('#group option').map((o) => o.value)).toEqual(['class', 'subject', 'student', 'lecturer', 'date'])
    type($('[data-role=filters] select'), '3')
    type($('#group'), 'student')
    $('#btn-generate').click()
    await flush()
    expect(calls.find((c) => c.url.startsWith('/api/reports')).url).toBe('/api/reports/attendance?group_by=student&class_id=3')
    expect($$('.sc-stat').map((c) => c.textContent.replace(/\s+/g, ' ').trim())).toEqual(['Attendance rate88.5%', 'Present80', 'Late5', 'Absent10', 'Excused5'])
    expect($$('.ch-col')).toHaveLength(2)
    expect($$('.dt-root tbody tr')).toHaveLength(2) // the chart also has a screen-reader table, so scope to the data table

    let blob
    URL.createObjectURL = vi.fn((b) => { blob = b; return 'blob:x' })
    URL.revokeObjectURL = vi.fn()
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    byText('button', 'Export CSV').click()
    const bytes = await readBytes(blob)
    expect([...bytes.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf]) // UTF-8 BOM so Excel reads Khmer correctly
    expect(new TextDecoder('utf-8', { ignoreBOM: true }).decode(bytes).slice(1).split('\r\n')).toEqual(['Student,Records,Present,Late,Absent,Excused,Attendance rate (%)', 'Sok,20,18,1,1,0,90.0', "'=cmd|x,4,4,0,0,0,100.0"])
  })

  it('lecturer: uses the lecturer report endpoint and has no lecturer grouping', async () => {
    window.USAMS.area = 'lecturer'
    mount('lecturer.reports')
    const calls = mockApi((c) => (c.url.startsWith('/api/lecturer/reports') ? { body: report } : paged([])))
    await run('reports')
    expect($$('#group option').map((o) => o.value)).toEqual(['class', 'subject', 'student', 'date'])
    $('#btn-generate').click(); await flush()
    expect(calls.find((c) => c.url.includes('reports')).url).toBe('/api/lecturer/reports/attendance?group_by=class')
  })

  it('shows loading on the button, handles errors with retry, and disables export when there are no rows', async () => {
    window.USAMS.area = 'admin'
    mount('admin.reports')
    let mode = 'error'
    mockApi((c) => (c.url.startsWith('/api/reports') ? (mode === 'error' ? { status: 500 } : { body: { data: { summary: {}, rows: [] } } }) : paged([])))
    await run('reports')
    $('#btn-generate').click()
    expect($('#btn-generate').disabled).toBe(true)
    expect($('#btn-generate').textContent).toContain('Generating…')
    await flush()
    expect($('#report-result .er-error')).not.toBeNull()
    expect($('#btn-generate').disabled).toBe(false)
    mode = 'ok'
    $('#report-result .er-btn').click(); await flush()
    expect(byText('button', 'Export CSV').disabled).toBe(true)
    expect($('#report-result').textContent).toContain('No attendance data')
    expect($('.sc-stat .sc-value').textContent).toBe('—')
  })
})

// ---------------------------------------------------------------------------------------------
describe('class detail and profile', () => {
  const item = { id: 5, class: { name: 'CS-1' }, subject: { name: 'Algo' }, semester: { name: 'S1' }, room: 'A1', status: 'ACTIVE', timetables: [{ id: 1, day_of_week: 'MONDAY', start_time: '08:00:00', end_time: '09:30:00', room: 'A1' }] }

  it('shows the class, its timetable and enrolled students', async () => {
    window.USAMS.area = 'lecturer'
    mount('lecturer.class-detail', { classId: '5' })
    const calls = mockApi((c) => (c.url.includes('/students') ? paged([{ id: 1, student_code: 'S001', name: 'Sok', email: 's@x.co' }]) : { body: { data: item } }))
    await run('class-detail')
    expect(calls.map((c) => c.url)).toEqual(['/api/lecturer/class-subjects/5', '/api/lecturer/class-subjects/5/students?per_page=500'])
    expect($('h1').textContent).toBe('CS-1 · Algo')
    expect($('.cp-meta').textContent).toContain('A1')
    expect($('.cp-block ul').textContent).toContain('Monday · 08:00–09:30')
    expect($$('tbody tr')).toHaveLength(1)
    expect($('#back-link').getAttribute('href')).toBe('/lecturer/classes')
  })

  it.each([[403, 'This class is not assigned to you.'], [404, 'The requested item was not found.']])('explains a %s', async (status, text) => {
    window.USAMS.area = 'lecturer'
    mount('lecturer.class-detail', { classId: '9' })
    mockApi(() => ({ status }))
    await run('class-detail')
    expect($('#class-root .er-error').textContent).toContain(status === 403 ? text : 'Class not found')
  })

  it('profile is read-only and has no password form unless enabled', async () => {
    window.USAMS.area = 'lecturer'
    mount('lecturer.profile')
    mockApi(() => ({ body: { data: { lecturer_code: 'L1', name: 'Dara', email: 'd@x.co', department: { name: 'CS' }, academic_title: 'Dr.', status: 'ACTIVE' } } }))
    await run('profile')
    expect($('#profile-root dl').textContent).toContain('Dr.')
    expect($('#profile-root .st-badge-success').textContent).toBe('Active')
    expect($('#profile-root form')).toBeNull()
  })

  it('password change posts the three fields and maps validation errors', async () => {
    features.passwordChange = true
    window.USAMS.area = 'lecturer'
    mount('lecturer.profile')
    let ok = false
    const calls = mockApi((c) => (c.method === 'POST' ? (ok ? { body: {} } : { status: 422, body: { errors: { password: ['Too short'] } } }) : { body: { data: { name: 'Dara', status: 'ACTIVE' } } }))
    await run('profile')
    type($('#cp'), 'old'); type($('#np'), 'x'); type($('#cf'), 'x')
    submit($('#profile-root form')); await flush()
    expect($('#np').closest('.field').querySelector('.field-error').textContent).toBe('Too short')
    ok = true
    submit($('#profile-root form')); await flush()
    expect(calls.filter((c) => c.method === 'POST').at(-1)).toMatchObject({ url: '/api/auth/password', body: { current_password: 'old', password: 'x', password_confirmation: 'x' } })
    expect($('#toasts').textContent).toContain('Password changed')
    expect($('#cp').value).toBe('')
  })
})

// ---------------------------------------------------------------------------------------------
describe('shell and theme', () => {
  const shellHtml = () => `<div class="sb-scrim" id="sidebar-scrim" hidden></div>
    <aside class="sb-sidebar" id="sidebar"><a class="sb-link" href="/admin/students">S</a><button id="btn-close-menu"></button></aside>
    <div class="sh-main-wrap" id="main-wrap">${renderPartial('partials.topbar')}</div>`

  it('collapses the sidebar, remembers it, and updates the button label', async () => {
    document.body.insertAdjacentHTML('beforeend', shellHtml())
    ;(await import('@/modules/shell')).initShell()
    const side = $('#sidebar'); const btn = $('#btn-collapse')
    expect(side.classList.contains('sb-collapsed')).toBe(false)
    btn.click()
    expect(side.classList.contains('sb-collapsed')).toBe(true)
    expect($('#main-wrap').classList.contains('sh-collapsed')).toBe(true)
    expect(localStorage.getItem('usams_sidebar_collapsed')).toBe('1')
    expect(btn.getAttribute('aria-label')).toBe('Expand sidebar')
    expect(btn.firstElementChild.className).toContain('bi-layout-sidebar')
    btn.click()
    expect(btn.getAttribute('aria-label')).toBe('Collapse sidebar')
  })

  it('opens and closes the mobile drawer', async () => {
    document.body.insertAdjacentHTML('beforeend', shellHtml())
    ;(await import('@/modules/shell')).initShell()
    $('#btn-open-menu').click()
    expect($('#sidebar').classList.contains('sb-open')).toBe(true)
    expect($('#sidebar-scrim').hidden).toBe(false)
    $('#sidebar-scrim').click()
    expect($('#sidebar').classList.contains('sb-open')).toBe(false)
    $('#btn-open-menu').click()
    $('.sb-link').addEventListener('click', (e) => e.preventDefault()) // jsdom cannot navigate
    $('.sb-link').click()
    expect($('#sidebar').classList.contains('sb-open')).toBe(false)
  })

  it('user menu: opens, closes on outside click and Escape; sign out confirms, calls the API, clears the token and goes to login', async () => {
    document.body.insertAdjacentHTML('beforeend', shellHtml())
    sessionStorage.setItem('usams_token', 'T')
    const { navigate } = await import('@/modules/utils/nav')
    const go = vi.spyOn(navigate, 'replace').mockImplementation(() => {})
    const calls = mockApi(() => ({ status: 204 }))
    ;(await import('@/modules/shell')).initShell()

    $('#user-menu-btn').click()
    expect($('#user-dropdown').hidden).toBe(false)
    expect($('#user-menu-btn').getAttribute('aria-expanded')).toBe('true')
    document.body.click()
    expect($('#user-dropdown').hidden).toBe(true)
    $('#user-menu-btn').click()
    $('#user-menu').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    expect($('#user-dropdown').hidden).toBe(true)

    $('#user-menu-btn').click(); $('#btn-logout').click()
    expect($('#cd-title').textContent).toBe('Sign out?')
    $('#cd-confirm').click(); await flush()
    expect(calls.find((c) => c.url === '/api/auth/logout').method).toBe('POST')
    expect(sessionStorage.getItem('usams_token')).toBeNull()
    expect(go).toHaveBeenCalledWith('/login')
  })

  it('language switch asks before discarding unsaved attendance', async () => {
    document.body.insertAdjacentHTML('beforeend', shellHtml())
    const { initShell, dirtyGuard: guard } = await import('@/modules/shell')
    initShell()
    guard.check = () => true
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
    const link = $('[data-language-toggle] a[href$="locale/km"]')
    expect(link).not.toBeNull()
    const click = new MouseEvent('click', { bubbles: true, cancelable: true })
    link.dispatchEvent(click)
    expect(confirm).toHaveBeenCalled()
    expect(click.defaultPrevented).toBe(true)
    guard.check = () => false
  })

  it('theme: light, dark and system (follows the OS) with saved choice and aria state', async () => {
    let dark = true
    window.matchMedia = vi.fn(() => ({ get matches() { return dark }, addEventListener() {} }))
    vi.resetModules()
    document.body.insertAdjacentHTML('beforeend', renderPartial('components.theme-toggle'))
    const theme = await import('@/modules/theme')
    theme.initTheme()
    expect(document.documentElement.dataset.theme).toBe('dark') // default "system" + OS dark
    expect($('[data-theme-mode=system]').getAttribute('aria-checked')).toBe('true')
    $('[data-theme-mode=light]').click()
    expect(document.documentElement.dataset.theme).toBe('light')
    expect(localStorage.getItem('usams_theme')).toBe('light')
    expect($('[data-theme-mode=light]').classList.contains('tt-on')).toBe(true)
    expect($('[data-theme-mode=system]').getAttribute('aria-checked')).toBe('false')
    $('[data-theme-mode=dark]').click()
    expect(document.documentElement.dataset.theme).toBe('dark')
  })
})
