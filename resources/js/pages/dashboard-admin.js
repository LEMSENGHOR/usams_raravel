import { qs, el, clear } from '@/modules/utils/dom'
import api from '@/api/client'
import { endpoints } from '@/modules/config/endpoints'
import { fmtDate, fmtPercent, newestFirst, personName, sessionClass, sessionSubject } from '@/modules/utils/helpers'
import { t } from '@/modules/i18n'
import { fillStatCards } from '@/modules/ui/statCard'
import { statusBadge } from '@/modules/ui/badge'
import { emptyState, errorState } from '@/modules/ui/states'
import { attendanceBarChart } from '@/modules/ui/chart'
import { buildAdminDashboard } from '@/modules/dashboardFallback'

// Expected keys from GET adminDashboard (verify in Phase 8): total_students, total_lecturers, active_classes,
// active_subjects, attendance_sessions, attendance_rate, attendance_overview[], recent_sessions[],
// recent_students[], recent_lecturers[], current_academic_year, current_semester. Missing keys render as "—".
export default function init() {
  const content = qs('#dash-content')
  const errorBox = qs('#dash-error')

  const pick = (data, k) => data?.stats?.[k] ?? data?.[k] ?? null

  const listItem = (main, aside) => el('li', {}, main, aside)

  function draw(data, loading) {
    const rate = pick(data, 'attendance_rate')
    fillStatCards(content, {
      total_students: pick(data, 'total_students'),
      total_lecturers: pick(data, 'total_lecturers'),
      active_classes: pick(data, 'active_classes'),
      active_subjects: pick(data, 'active_subjects'),
      attendance_sessions: pick(data, 'attendance_sessions'),
      attendance_rate: rate == null ? null : fmtPercent(rate),
    }, loading)

    const overview = data?.attendance_overview ?? []
    const sessions = data?.recent_sessions ?? []
    const people = [
      ...(data?.recent_students ?? []).map((p) => ({ ...p, kind: 'Student' })),
      ...(data?.recent_lecturers ?? []).map((p) => ({ ...p, kind: 'Lecturer' })),
    ].sort(newestFirst).slice(0, 5)

    const box = (id) => clear(qs(id))
    const chart = box('#dash-overview')
    if (overview.length) chart.append(attendanceBarChart(overview))
    else if (!loading) chart.append(emptyState({ title: 'No attendance data yet', description: 'The chart appears once attendance has been recorded.' }))

    const year = box('#dash-year')
    if (data?.current_academic_year || data?.current_semester) {
      year.append(el('dl', {},
        el('div', {}, el('dt', {}, t('Academic year')), el('dd', {}, data.current_academic_year?.name ?? '—')),
        el('div', {}, el('dt', {}, t('Semester')), el('dd', {}, data.current_semester?.name ?? '—'))))
    } else if (!loading) year.append(emptyState({ title: 'None active', description: 'No current academic year or semester is set.' }))

    const recent = box('#dash-sessions')
    if (sessions.length) {
      recent.append(el('ul', { class: 'ad-list' }, sessions.map((s) => listItem(
        el('span', {}, el('strong', {}, sessionClass(s)), ` · ${sessionSubject(s)}`, el('br'), el('small', {}, fmtDate(s.session_date))),
        statusBadge(s.status)))))
    } else if (!loading) recent.append(emptyState({ title: 'No sessions yet' }))

    const added = box('#dash-people')
    if (people.length) {
      added.append(el('ul', { class: 'ad-list' }, people.map((p) => listItem(
        el('span', {}, el('strong', {}, personName(p)), el('br'), el('small', {}, t(p.kind))),
        el('small', {}, fmtDate(p.created_at))))))
    } else if (!loading) added.append(emptyState({ title: 'Nobody added recently' }))
  }

  async function load() {
    errorBox.hidden = true
    content.hidden = false
    draw(null, true)
    try {
      let data
      try {
        const body = await api.get(endpoints.adminDashboard)
        data = body?.data ?? body
      } catch (error) {
        if (error.status !== 404) throw error
        data = await buildAdminDashboard() // no dashboard endpoint: build the figures from the list endpoints
      }
      draw(data, false)
    } catch (error) {
      content.hidden = true
      errorBox.hidden = false
      clear(errorBox).append(errorState({ title: 'Could not load dashboard figures', message: error.message, onRetry: load }))
    }
  }
  load()
}