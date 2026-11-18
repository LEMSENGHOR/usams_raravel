import { qs, el } from '@/modules/utils/dom'
import { icon } from '@/modules/ui/icon'
import { renderDataTable } from '@/modules/ui/table'
import { renderPagination } from '@/modules/ui/pagination'
import { searchAndFilterBar } from '@/modules/ui/filters'
import { formDialog } from '@/modules/ui/form'
import { confirmDialog } from '@/modules/ui/dialog'
import { createResource } from '@/api/resource'
import { sessionApi } from '@/api/attendance'
import { createResourceList } from '@/modules/list'
import { endpoints } from '@/modules/config/endpoints'
import { assignmentLabel, SESSION } from '@/modules/config/resources'
import { todayISO, url } from '@/modules/utils/helpers'
import { toast } from '@/modules/toast'
import { t } from '@/modules/i18n'

const columns = [
  { key: 'session_date', label: 'Date', type: 'date' }, { key: 'class.name', label: 'Class' }, { key: 'subject.name', label: 'Subject' },
  { key: 'start_time', label: 'Starts', type: 'time' }, { key: 'end_time', label: 'Ends', type: 'time' }, { key: 'status', label: 'Status', type: 'badge' },
]
const filters = [{ key: 'status', label: 'Statuses', options: SESSION }, { key: 'session_date', label: 'Session date', type: 'date' }]
// Step 1-3 of the workflow: choose an assigned class-subject, date and scheduled time, then create.
const fields = [
  { key: 'class_subject_id', label: 'Class and subject', type: 'select', required: true, remote: { path: endpoints.lecturer.assignments, label: assignmentLabel } },
  { key: 'session_date', label: 'Session date', type: 'date', required: true, default: todayISO() },
  { key: 'start_time', label: 'Start time', type: 'time', required: true }, { key: 'end_time', label: 'End time', type: 'time', required: true },
]
const copy = {
  open: { title: 'Open this session?', label: 'Open session', message: 'Students can then be marked.', done: 'Session opened' },
  close: { title: 'Close this session?', label: 'Close session', message: 'The system applies its own closing rules to unmarked students.', done: 'Session closed' },
  cancel: { title: 'Cancel this session?', label: 'Cancel session', message: 'A cancelled session cannot be opened again.', done: 'Session cancelled' },
}

export default function init() {
  const service = createResource(endpoints.lecturer.sessions)
  const api = sessionApi(endpoints.lecturer.sessions)
  const list = createResourceList(service, { onChange: render })
  const panel = qs('[data-panel]')
  const tableBox = qs('[data-role="table"]', panel)

  qs('[data-role="filters"]', panel).append(searchAndFilterBar({ filters, showSearch: false, onFilter: list.setFilter }))

  qs('#btn-new-session').addEventListener('click', () => formDialog({
    title: 'New attendance session',
    fields,
    submitLabel: 'Create session',
    onSubmit: (payload) => service.create(payload),
    onSaved: () => { toast.success('Session created', 'Open it when class starts.'); list.load() },
  }))

  const ask = (row, action) => confirmDialog({
    title: copy[action].title,
    message: copy[action].message,
    confirmLabel: copy[action].label,
    danger: action === 'cancel',
    onConfirm: async () => {
      try {
        await api[action](row.id)
        toast.success(copy[action].done)
        list.load()
      } catch (e) {
        toast.error('Action failed', e.message)
        throw e // keep the dialog open
      }
    },
  })

  const sessionUrl = (row) => url(`/lecturer/attendance/sessions/${row.id}`)
  const actions = (row) => [
    row.status === 'SCHEDULED' ? el('button', { class: 'btn', type: 'button', onclick: () => ask(row, 'open') }, icon('play-fill'), t('Open')) : null,
    row.status === 'OPEN' ? el('a', { class: 'btn btn-primary', href: sessionUrl(row) }, t('Take attendance'), icon('arrow-right')) : null,
    row.status === 'OPEN' ? el('button', { class: 'btn', type: 'button', onclick: () => ask(row, 'close') }, icon('lock'), t('Close')) : null,
    row.status === 'SCHEDULED' ? el('button', { class: 'btn', type: 'button', onclick: () => ask(row, 'cancel') }, t('Cancel')) : null,
    ['CLOSED', 'CANCELLED', 'SCHEDULED'].includes(row.status) ? el('a', { class: 'btn', href: sessionUrl(row) }, t('View')) : null,
  ]

  function render(state) {
    renderDataTable(tableBox, { columns, rows: state.items, loading: state.loading, error: state.error, actions, emptyTitle: 'No sessions yet', emptyText: 'Create a session for one of your classes.', onRetry: list.load })
    renderPagination(qs('[data-role="pager"]', panel), { ...state.meta, onChange: list.setPage })
  }
  list.load()
}
