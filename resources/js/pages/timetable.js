import { qs, el, clear } from '@/modules/utils/dom'
import { icon } from '@/modules/ui/icon'
import { errorState, loadingSkeleton } from '@/modules/ui/states'
import { searchAndFilterBar } from '@/modules/ui/filters'
import { formDialog } from '@/modules/ui/form'
import { confirmDialog } from '@/modules/ui/dialog'
import { createResource } from '@/api/resource'
import { endpoints, DAYS } from '@/modules/config/endpoints'
import { assignmentLabel } from '@/modules/config/resources'
import { fmtTime } from '@/modules/utils/helpers'
import { toast } from '@/modules/toast'
import { t } from '@/modules/i18n'

// Weekly timetable. Admin can add/edit/delete; lecturers see only their own entries (read-only).
export default function init() {
  const isAdmin = window.USAMS.area === 'admin'
  const service = createResource(isAdmin ? endpoints.timetables : endpoints.lecturer.timetables)
  const root = qs('#week-root')
  let classFilter = ''

  const fields = [
    { key: 'class_subject_id', label: 'Class and subject', type: 'select', required: true, remote: { path: endpoints.assignments, label: assignmentLabel } },
    { key: 'day_of_week', label: 'Day', type: 'select', required: true, options: DAYS },
    { key: 'start_time', label: 'Start time', type: 'time', required: true }, { key: 'end_time', label: 'End time', type: 'time', required: true }, { key: 'room', label: 'Room' },
  ]

  function week(entries) {
    const days = DAYS.map((d) => ({
      ...d,
      // items: entries.filter((e) => String(e.day_of_week).toUpperCase() === d.value)
      items: entries.filter((e) =>
    Number(e.day_of_week) === Number(d.value)
).sort((a, b) => String(a.start_time).localeCompare(String(b.start_time))),
    })).filter((d) => d.items.length || !['SATURDAY', 'SUNDAY'].includes(d.value))

    return el('div', { class: 'tp-week' }, days.map((d) => el('section', { class: 'tp-day card', 'aria-label': t(d.label) },
      el('h2', {}, t(d.label)),
      d.items.length ? null : el('p', { class: 'tp-none' }, t('No classes')),
      d.items.map((e) => el('article', { class: 'tp-entry' },
        el('strong', {}, `${fmtTime(e.start_time)} – ${fmtTime(e.end_time)}`),
        el('span', {}, e.subject?.name ?? e.class_subject?.subject?.name ?? t('Subject')),
        el('span', { class: 'tp-muted' }, `${e.class?.name ?? e.class_subject?.class?.name ?? ''}${e.room ? ` · ${t('Room {room}', { room: e.room })}` : ''}`),
        isAdmin && (e.lecturer?.name || e.class_subject?.lecturer?.name) ? el('span', { class: 'tp-muted' }, e.lecturer?.name ?? e.class_subject?.lecturer?.name) : null,
        isAdmin ? el('div', { class: 'tp-row' },
          el('button', { class: 'btn tp-sm', type: 'button', 'aria-label': t('Edit entry {time}', { time: fmtTime(e.start_time) }), onclick: () => openForm(e) }, icon('pencil', 14), t('Edit')),
          el('button', { class: 'btn tp-sm', type: 'button', 'aria-label': t('Delete entry {time}', { time: fmtTime(e.start_time) }), onclick: () => askDelete(e) }, icon('trash', 14), t('Delete'))) : null)))))
  }

  async function load() {
    clear(root).append(loadingSkeleton(6))
    try {
      const { items } = await service.list({ per_page: 200, ...(classFilter ? { class_id: classFilter } : {}) })
      clear(root)
      if (!items.length) root.append(el('p', { class: 'tp-empty card' }, classFilter ? t('No timetable entries for this class yet.') : t('No timetable entries yet.')))
      else root.append(week(items))
    } catch (error) {
      clear(root).append(el('div', { class: 'card' }, errorState({ message: error.message, onRetry: load })))
    }
  }

  const openForm = (entry = null) => formDialog({
    title: entry ? 'Edit timetable entry' : 'Add timetable entry',
    fields,
    initial: entry,
    onSubmit: (payload) => (entry ? service.update(entry.id, payload) : service.create(payload)),
    onSaved: () => { toast.success(entry ? 'Timetable entry updated' : 'Timetable entry added'); load() },
  })

  const askDelete = (entry) => confirmDialog({
    title: 'Delete this entry?',
    message: 'The class will no longer appear at this time.',
    confirmLabel: 'Delete',
    danger: true,
    onConfirm: async () => {
      try {
        await service.remove(entry.id)
        toast.success('Timetable entry deleted')
        load()
      } catch (e) {
        toast.error('Could not delete entry', e.message)
        throw e
      }
    },
  })

  if (isAdmin) {
    qs('.ph-actions').append(el('button', { class: 'btn btn-primary', type: 'button', onclick: () => openForm() }, icon('plus-lg'), t('Add entry')))
    qs('#tp-filter').append(searchAndFilterBar({
      filters: [{ key: 'class_id', label: 'Classes', remote: { path: endpoints.classes } }],
      showSearch: false,
      onFilter: (_key, value) => { classFilter = value; load() },
    }))
  }
  load()
}
