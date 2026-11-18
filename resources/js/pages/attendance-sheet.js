import { qs, el, clear } from '@/modules/utils/dom'
import { icon } from '@/modules/ui/icon'
import { pageHeader } from '@/modules/ui/pageHeader'
import { statusBadge } from '@/modules/ui/badge'
import { emptyState, errorState, loadingSkeleton } from '@/modules/ui/states'
import { statusSegmented } from '@/modules/ui/segmented'
import { confirmDialog } from '@/modules/ui/dialog'
import { dirtyGuard } from '@/modules/shell'
import { sessionApi } from '@/api/attendance'
import { endpoints, features } from '@/modules/config/endpoints'
import { fmtDate, fmtTime, url } from '@/modules/utils/helpers'
import { toast } from '@/modules/toast'
import { t, tl } from '@/modules/i18n'

// Manual attendance screen. Lecturers edit while the session is OPEN; admins only view.
export default function init() {
  const scope = window.USAMS.area // 'admin' | 'lecturer'
  const api = sessionApi(scope === 'admin' ? endpoints['attendance-sessions'] : endpoints.lecturer.sessions)
  const root = qs('#sheet-root')
  const id = root.dataset.id
  qs('#back-link').href = url(scope === 'admin' ? '/admin/attendance/sessions' : '/lecturer/attendance/sessions')

  const state = { session: null, rows: [], saving: false, acting: false, search: '', statusFilter: '' }
  const ui = {} // live references to the current page's elements

  const editable = () => scope === 'lecturer' && state.session?.status === 'OPEN'
  const dirty = () => state.rows.filter((r) => r.status && (r.status !== r.savedStatus || (features.attendanceNotes && r.note !== r.savedNote)))
  const counts = () => {
    const c = { PRESENT: 0, LATE: 0, ABSENT: 0, EXCUSED: 0, NONE: 0 }
    for (const r of state.rows) c[r.status ?? 'NONE']++
    return c
  }
  const visibleRows = () => {
    const q = state.search.trim().toLowerCase()
    return state.rows.filter((r) => {
      if (q && !`${r.name} ${r.code}`.toLowerCase().includes(q)) return false
      if (state.statusFilter === 'NONE') return !r.status
      return !state.statusFilter || r.status === state.statusFilter
    })
  }

  // function toRow(r) {
  //   const rec = r.record ?? null
  //   const status = rec?.status ?? r.status ?? null
  //   const note = rec?.note ?? r.note ?? ''
  //   return {
  //     student_id: r.student?.id ?? r.student_id ?? r.id,
  //     code: r.student?.student_code ?? r.student_code ?? '',
  //     name: r.student?.name ?? r.name ?? '',
  //     status, savedStatus: status,
  //     note, savedNote: note,
  //     checkIn: rec?.check_in_time ?? r.check_in_time ?? null,
  //   }
  // }

function toRow(r) {
  // Backend AttendanceRecordResource returns the record directly.
  const rec = r.record ?? r
  const student = r.student ?? rec.student ?? {}

  const status = rec?.status ?? r.status ?? null
  const note = rec?.note ?? r.note ?? ''

  return {
    record_id: rec?.id ?? r.record_id ?? null,
    student_id: student.id ?? r.student_id ?? null,
    code: student.student_code ?? r.student_code ?? '',
    name: student.name ?? r.name ?? '',
    status,
    savedStatus: status,
    note,
    savedNote: note,
    checkIn: rec?.marked_at ?? r.marked_at ?? null,
  }
}


  async function load() {
    try {
      const [session, recs] = await Promise.all([api.get(id), api.records(id)])
      state.session = session
      state.rows = recs.map(toRow)
      build()
    } catch (error) {
      clear(root).append(el('div', { class: 'card' }, errorState({ message: error.message, onRetry: load })))
    }
  }

  async function run(fn, okMsg, failMsg) {
    state.acting = true
    refreshButtons()
    try { await fn(); toast.success(okMsg); await load() } catch (e) { toast.error(failMsg, e.message) } finally { state.acting = false; refreshButtons() }
  }
  const openSession = () => run(() => api.open(id), 'Session opened', 'Could not open session')
  const closeSession = () => run(() => api.close(id), 'Session closed', 'Could not close session')
  const cancelSession = () => run(() => api.cancel(id), 'Session cancelled', 'Could not cancel session')

  async function save() {
    state.saving = true
    refreshButtons()
    try {
      // const records = dirty().map((r) => ({ student_id: r.student_id, status: r.status, ...(features.attendanceNotes ? { note: r.note || null } : {}) }))
      const records = dirty().map((r) => ({
  record_id: r.record_id,
  status: r.status,
  ...(features.attendanceNotes ? { note: r.note || null } : {})
}))

      await api.saveRecords(id, records)
      toast.success(t(records.length === 1 ? 'Attendance saved for {n} student' : 'Attendance saved for {n} students', { n: records.length }))
      await load()
    } catch (e) {
      toast.error('Attendance was not saved', e.message)
    } finally { state.saving = false; refreshButtons() }
  }

  function markAllPresent() {
    state.rows.forEach((r) => { if (!r.status) r.status = 'PRESENT' })
    toast.push({ type: 'info', title: 'Marked unmarked students as present', message: 'Press Save attendance to keep these changes.' })
    renderTable()
    refreshSummary()
    refreshButtons()
  }

  // ---- small redraw helpers (the search box and focus are kept while marking) ----
  function refreshSummary() {
    const c = counts()
    clear(ui.chips).append(
      statusBadge('PRESENT'), ` ${c.PRESENT} `, statusBadge('LATE'), ` ${c.LATE} `, statusBadge('ABSENT'), ` ${c.ABSENT} `,
      statusBadge('EXCUSED'), ` ${c.EXCUSED} `, statusBadge(null), ` ${c.NONE}`)
  }

  function refreshButtons() {
    const n = dirty().length
    if (ui.saveBtn) {
      ui.saveBtn.disabled = state.saving || !n
      ui.saveBtn.replaceChildren(icon('floppy'), state.saving ? t('Saving…') : `${t('Save attendance')}${n ? ` (${n})` : ''}`)
    }
    if (ui.closeBtn) {
      ui.closeBtn.disabled = state.acting || n > 0
      if (n > 0) ui.closeBtn.title = t('Save your changes before closing')
      else ui.closeBtn.removeAttribute('title')
    }
    for (const b of ui.sessionBtns ?? []) b.disabled = state.acting
  }

  function renderTable() {
    const rows = visibleRows()
    clear(ui.tableBox)
    if (!state.rows.length) return ui.tableBox.append(emptyState({ title: 'No eligible students', description: 'No students are enrolled in this class for the session’s period.' }))
    if (!rows.length) return ui.tableBox.append(emptyState({ title: 'No students match', description: 'Change the search or status filter.' }))

    const head = el('tr', {}, el('th', {}, t('Student code')), el('th', {}, t('Student name')), el('th', {}, t('Attendance status')), el('th', {}, t('Check-in')),
      features.attendanceNotes ? el('th', {}, t('Note')) : null)
    const body = rows.map((r) => {
      const statusCell = editable()
        ? statusSegmented({ name: r.name, value: r.status, onChange: (s) => { r.status = s; refreshSummary(); refreshButtons(); if (state.statusFilter) renderTable() } }).el
        : statusBadge(r.status)
      return el('tr', {},
        el('td', { class: 'as-c-code' }, r.code || '—'),
        el('td', { class: 'as-c-name' }, el('strong', {}, r.name)),
        el('td', { class: 'as-c-status' }, statusCell),
        el('td', { class: 'as-c-checkin', 'data-label': t('Check-in') }, fmtTime(r.checkIn)),
        features.attendanceNotes
          ? el('td', { class: 'as-c-note' }, el('input', { class: 'input', value: r.note ?? '', disabled: !editable(), 'aria-label': t('Note for {name}', { name: r.name }), oninput: (e) => { r.note = e.target.value; refreshButtons() } }))
          : null)
    })
    ui.tableBox.append(el('div', { class: 'as-scroll' }, el('table', {}, el('thead', {}, head), el('tbody', {}, body))))
  }

function handleAttendanceUpdate(event) {
  if (event.action !== 'record_marked') return

  const incoming = event.data?.record
  if (!incoming?.id) return

  const index = state.rows.findIndex(
    (row) => Number(row.record_id) === Number(incoming.id)
  )

  if (index === -1) return

  const current = state.rows[index]

  // Preserve local changes that have not been saved.
  const hasLocalChanges =
    current.status !== current.savedStatus ||
    (features.attendanceNotes && current.note !== current.savedNote)

  if (hasLocalChanges) {
    toast.info(
      'មានការកែប្រែពីអ្នកប្រើផ្សេង',
      'ទិន្នន័យដែលអ្នកកំពុងកែ មិនត្រូវបានជំនួសទេ។'
    )
    return
  }

  state.rows[index] = toRow(incoming)

  refreshSummary()
  renderTable()
}

  function build() {
    const { session } = state
    const classSubject = session.class_subject ?? {}
    ui.sessionBtns = []

    // header actions (lecturer only)
    const actions = []
    if (scope === 'lecturer') {
      if (session.status === 'SCHEDULED') {
        const open = el('button', { class: 'btn btn-primary', type: 'button', onclick: openSession }, icon('play-fill'), t('Open session'))
        const cancel = el('button', { class: 'btn', type: 'button', onclick: () => confirmDialog({ title: 'Cancel this session?', message: 'A cancelled session cannot be opened again.', confirmLabel: 'Cancel session', danger: true, onConfirm: cancelSession }) }, t('Cancel session'))
        ui.sessionBtns.push(open, cancel)
        actions.push(open, cancel)
      }
      if (editable()) {
        ui.closeBtn = el('button', { class: 'btn', type: 'button', onclick: () => confirmDialog({
          title: 'Close this session?', confirmLabel: 'Close session', onConfirm: closeSession,
          message: t('{none} of {total} students are not marked. The system applies its own closing rules; you may not be able to edit attendance afterwards.', { none: counts().NONE, total: state.rows.length }),
        }) }, icon('lock'), t('Close session'))
        actions.push(ui.closeBtn)
      } else ui.closeBtn = null
    }

    ui.chips = el('section', { class: 'as-chips', 'aria-label': t('Summary') })
    const hint = scope === 'lecturer' && session.status === 'SCHEDULED'
      ? t('Open the session to start marking attendance.')
      : !editable() ? t('This session is {status}. Attendance is read-only.', { status: tl(session.status.charAt(0) + session.status.slice(1).toLowerCase()) }) : ''

    // tools bar
    const search = el('input', { class: 'input as-input', type: 'search', placeholder: t('Search by name or student code'), 'aria-label': t('Search students'), value: state.search,
      oninput: (e) => { state.search = e.target.value; renderTable() } })
    const filter = el('select', { class: 'input as-sel', 'aria-label': t('Filter by status'), onchange: (e) => { state.statusFilter = e.target.value; renderTable() } },
      [['', 'All statuses'], ['PRESENT', 'Present'], ['LATE', 'Late'], ['ABSENT', 'Absent'], ['EXCUSED', 'Excused'], ['NONE', 'Not marked']].map(([v, l]) => el('option', { value: v }, t(l))))
    filter.value = state.statusFilter
    ui.saveBtn = editable() ? el('button', { class: 'btn btn-primary', type: 'button', onclick: save }) : null
    const markAll = editable() && features.markAllPresent
      ? el('button', { class: 'btn', type: 'button', onclick: () => confirmDialog({
          title: 'Mark all as present?', confirmLabel: 'Mark present', onConfirm: markAllPresent,
          message: t('{none} students without a status will be set to Present. You can change any of them before saving.', { none: counts().NONE }),
        }) }, icon('check-all'), t('Mark all present'))
      : null
    ui.tableBox = el('div')

    clear(root).append(
      // pageHeader({ title: `${session.class?.name ?? t('Class')} · ${session.subject?.name ?? t('Subject')}`, actions }),
      pageHeader({
  title: `${classSubject.class?.name ?? t('Class')} · ${classSubject.subject?.name ?? t('Subject')}`,
  actions
}),
      el('section', { class: 'card as-meta', 'aria-label': t('Session details') },
        el('div', {}, el('span', { class: 'as-k' }, t('Date')), fmtDate(session.session_date)),
        el('div', {}, el('span', { class: 'as-k' }, t('Time')), `${fmtTime(session.start_time)} – ${fmtTime(session.end_time)}`),
        el('div', {}, el('span', { class: 'as-k' }, t('Status')), statusBadge(session.status)),
        el('div', {}, el('span', { class: 'as-k' }, t('Students')), String(state.rows.length)),
        classSubject.lecturer?.name ? el('div', {}, el('span', { class: 'as-k' }, t('Lecturer')), classSubject.lecturer.name) : null),
      ui.chips,
      hint ? el('p', { class: 'as-hint' }, hint) : null,
      el('div', { class: 'card' },
        el('div', { class: 'as-tools' }, el('div', { class: 'as-search' }, icon('search'), search), filter, markAll, ui.saveBtn),
        ui.tableBox))

    refreshSummary()
    refreshButtons()
    renderTable()
  }

  // ---- unsaved-changes protection (replaces the Vue Router leave guard) ----
  const onUnload = (e) => { if (!dirtyGuard.leaving && dirty().length) { e.preventDefault(); e.returnValue = '' } }
  const onLinkClick = (e) => {
    const link = e.target.closest?.('a[href]')
    if (!link || link.target === '_blank' || link.closest('[data-language-toggle]') || !dirty().length) return
    if (window.confirm(t('You have unsaved attendance changes. Leave without saving?'))) dirtyGuard.leaving = true
    else e.preventDefault()
  }
  dirtyGuard.dispose?.()
  window.addEventListener('beforeunload', onUnload)
  document.addEventListener('click', onLinkClick)
  // dirtyGuard.dispose = () => { window.removeEventListener('beforeunload', onUnload); document.removeEventListener('click', onLinkClick) }
  dirtyGuard.dispose = () => {
  window.removeEventListener('beforeunload', onUnload)
  document.removeEventListener('click', onLinkClick)

  window.Echo?.leave(channelName)
}
  dirtyGuard.check = () => dirty().length > 0

  clear(root).append(loadingSkeleton(6))
  load()
  const channelName = `attendance.session.${id}`

window.Echo
  ?.private(channelName)
  .listen('.attendance.updated', handleAttendanceUpdate)
}
