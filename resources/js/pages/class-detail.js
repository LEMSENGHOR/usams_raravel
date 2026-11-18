import { qs, el, clear } from '@/modules/utils/dom'
import { icon } from '@/modules/ui/icon'
import { pageHeader } from '@/modules/ui/pageHeader'
import { statusBadge } from '@/modules/ui/badge'
import { errorState, loadingSkeleton } from '@/modules/ui/states'
import { renderDataTable } from '@/modules/ui/table'
import { createResource, normalizeList } from '@/api/resource'
import api from '@/api/client'
import { endpoints } from '@/modules/config/endpoints'
import { dayLabel, url } from '@/modules/utils/helpers'
import { t } from '@/modules/i18n'

const columns = [{ key: 'student_code', label: 'Student code' }, { key: 'name', label: 'Name' }, { key: 'email', label: 'Email' }]

export default function init() {
  const root = qs('#class-root')
  const id = root.dataset.id

  async function load() {
    clear(root).append(loadingSkeleton())
    let item = null
    try {
      item = await createResource(endpoints.lecturer.assignments).get(id)
    } catch (error) {
      clear(root).append(el('div', { class: 'card' }, errorState({
        title: error.status === 404 ? 'Class not found' : 'Could not load this class',
        message: error.status === 403 ? t('This class is not assigned to you.') : error.message,
        onRetry: load,
      })))
      return
    }

    const rosterBox = el('div')
    const draw = (state) => renderDataTable(rosterBox, { columns, emptyTitle: 'No enrolled students', onRetry: load, ...state })
    draw({ loading: true })

    clear(root).append(
      pageHeader({ title: `${item.class?.name ?? t('Class')} · ${item.subject?.name ?? t('Subject')}` }),
      el('section', { class: 'card cp-meta cp-card' },
        el('div', {}, el('span', { class: 'cp-k' }, t('Semester')), item.semester?.name ?? '—'),
        el('div', {}, el('span', { class: 'cp-k' }, t('Room')), item.room ?? '—'),
        el('div', {}, el('span', { class: 'cp-k' }, t('Status')), statusBadge(item.status))),
      item.timetables?.length
        ? el('section', { class: 'card cp-block cp-card' }, el('h2', {}, t('Timetable')),
            el('ul', {}, item.timetables.map((tt) => el('li', {}, `${dayLabel(tt.day_of_week)} · ${String(tt.start_time).slice(0, 5)}–${String(tt.end_time).slice(0, 5)} · ${tt.room ?? ''}`))))
        : null,
      el('section', { class: 'card cp-card' }, el('h2', { class: 'cp-block' }, t('Enrolled students')), rosterBox))

    try {
      const body = await api.get(`${endpoints.lecturer.assignments}/${id}/students`, { per_page: 500 })
      draw({ rows: normalizeList(body).items })
    } catch (error) { draw({ error }) }
  }

  qs('#back-link').href = url('/lecturer/classes')
  load()
}
