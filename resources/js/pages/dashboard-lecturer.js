import { qs, el, clear } from '@/modules/utils/dom'
import api from '@/api/client'
import { endpoints } from '@/modules/config/endpoints'
import { getUser } from '@/modules/auth'
import { dayLabel, fmtDate, fmtPercent, fmtTime } from '@/modules/utils/helpers'
import { t } from '@/modules/i18n'
import { fillStatCards } from '@/modules/ui/statCard'
import { statusBadge } from '@/modules/ui/badge'
import { emptyState, errorState } from '@/modules/ui/states'

// Expected keys (verify in Phase 8): assigned_classes, assigned_subjects, sessions_opened_today, today_classes[],
// recent_sessions[], upcoming_timetable[], class_summaries[{ class, subject, attendance_rate }]. Missing keys show "—".
export default function init() {
  const content = qs('#dash-content')
  const errorBox = qs('#dash-error')
  qs('#welcome-title').textContent = t('Welcome, {name}', { name: getUser()?.name ?? t('Lecturer') })

  const pick = (data, k) => data?.stats?.[k] ?? data?.[k] ?? null
  const label = (e) => `${e.class?.name ?? e.class_subject?.class?.name ?? ''} · ${e.subject?.name ?? e.class_subject?.subject?.name ?? ''}`

  function list(box, items, render, empty, loading) {
    clear(qs(box))
    if (items.length) qs(box).append(el('ul', { class: 'ld-list' }, items.map(render)))
    else if (!loading) qs(box).append(emptyState({ title: empty }))
  }

  function draw(data, loading) {
    const today = data?.today_classes ?? []
    fillStatCards(content, {
      assigned_classes: pick(data, 'assigned_classes'),
      assigned_subjects: pick(data, 'assigned_subjects'),
      today_classes: pick(data, 'today_classes_count') ?? (data?.today_classes ? today.length : null),
      sessions_opened_today: pick(data, 'sessions_opened_today'),
    }, loading)

    list('#dash-today', today, (e) => el('li', {}, el('span', {}, el('strong', {}, label(e)), el('br'),
      el('small', {}, `${fmtTime(e.start_time)} – ${fmtTime(e.end_time)}`, e.room ? ` · ${t('Room {room}', { room: e.room })}` : ''))), 'No classes today', loading)
    list('#dash-upcoming', data?.upcoming_timetable ?? [], (e) => el('li', {}, el('span', {}, el('strong', {}, label(e)), el('br'),
      el('small', {}, `${dayLabel(e.day_of_week)} · ${fmtTime(e.start_time)} – ${fmtTime(e.end_time)}`))), 'Nothing scheduled', loading)
    list('#dash-sessions', data?.recent_sessions ?? [], (s) => el('li', {}, el('span', {}, el('strong', {}, label(s)), el('br'),
      el('small', {}, fmtDate(s.session_date))), statusBadge(s.status)), 'No sessions yet', loading)
    list('#dash-summaries', data?.class_summaries ?? [], (c) => el('li', {}, el('span', {}, el('strong', {}, label(c))),
      el('strong', {}, fmtPercent(c.attendance_rate))), 'No attendance recorded yet', loading)
  }

  async function load() {
    errorBox.hidden = true
    content.hidden = false
    draw(null, true)
    try {
      const body = await api.get(endpoints.lecturer.dashboard)
      draw(body?.data ?? body, false)
    } catch (error) {
      content.hidden = true
      errorBox.hidden = false
      clear(errorBox).append(errorState({ title: 'Could not load your dashboard', message: error.message, onRetry: load }))
    }
  }
  load()
}
