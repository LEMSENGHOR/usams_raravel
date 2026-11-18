import { qs, el, clear } from '@/modules/utils/dom'
import { icon } from '@/modules/ui/icon'
import { statCard } from '@/modules/ui/statCard'
import { emptyState, errorState } from '@/modules/ui/states'
import { searchAndFilterBar } from '@/modules/ui/filters'
import { renderDataTable } from '@/modules/ui/table'
import { attendanceBarChart } from '@/modules/ui/chart'
import api from '@/api/client'
import { endpoints } from '@/modules/config/endpoints'
import { assignmentLabel } from '@/modules/config/resources'
import { fmtPercent, todayISO } from '@/modules/utils/helpers'
import { downloadCsv, toCsv } from '@/modules/utils/csv'
import { t } from '@/modules/i18n'

// Summary by class, subject, student, lecturer or date. Nothing is shown until the API returns it.
export default function init() {
  const isAdmin = window.USAMS.area === 'admin'
  const path = isAdmin ? endpoints.adminReport : endpoints.lecturer.report
  const GROUPS = [{ value: 'class', label: 'Class' }, { value: 'subject', label: 'Subject' }, { value: 'student', label: 'Student' }, ...(isAdmin ? [{ value: 'lecturer', label: 'Lecturer' }] : []), { value: 'date', label: 'Date' }]
  const filters = isAdmin
    ? [{ key: 'class_id', label: 'Classes', remote: { path: endpoints.classes } }, { key: 'subject_id', label: 'Subjects', remote: { path: endpoints.subjects } }, { key: 'lecturer_id', label: 'Lecturers', remote: { path: endpoints.lecturers } }, { key: 'date_from', label: 'From date', type: 'date' }, { key: 'date_to', label: 'To date', type: 'date' }]
    : [{ key: 'class_subject_id', label: 'Classes and subjects', remote: { path: endpoints.lecturer.assignments, label: assignmentLabel } }, { key: 'date_from', label: 'From date', type: 'date' }, { key: 'date_to', label: 'To date', type: 'date' }]

  const params = { group_by: 'class' }
  const columns = [
    { label: 'Group', value: (r) => r.label ?? r.name }, { key: 'total', label: 'Records' }, { key: 'present', label: 'Present' }, { key: 'late', label: 'Late' },
    { key: 'absent', label: 'Absent' }, { key: 'excused', label: 'Excused' }, { label: 'Attendance rate', value: (r) => fmtPercent(r.attendance_rate) },
  ]
  const result = qs('#report-result')
  let data = null

  // ---- filters + group-by + generate ----
  qs('[data-role="filters"]').append(searchAndFilterBar({
    filters, showSearch: false,
    onFilter: (k, v) => { if (v) params[k] = v; else delete params[k] },
  }))
  const group = qs('#group')
  group.append(...GROUPS.map((g) => el('option', { value: g.value }, t(g.label))))
  group.addEventListener('change', () => { params.group_by = group.value })
  const generateBtn = qs('#btn-generate')
  const setBusy = (busy) => {
    generateBtn.disabled = busy
    generateBtn.replaceChildren(busy ? icon('arrow-repeat', 16, 'rp-spin') : icon('bar-chart-line'), busy ? t('Generating…') : t('Generate report'))
  }

  function exportCsv() {
    const rows = data?.rows ?? []
    const cols = [
      { label: t(GROUPS.find((g) => g.value === params.group_by)?.label ?? 'Group'), get: (r) => r.label ?? r.name },
      { label: t('Records'), get: (r) => r.total }, { label: t('Present'), get: (r) => r.present }, { label: t('Late'), get: (r) => r.late },
      { label: t('Absent'), get: (r) => r.absent }, { label: t('Excused'), get: (r) => r.excused },
      { label: t('Attendance rate (%)'), get: (r) => (r.attendance_rate == null ? '' : Number(r.attendance_rate).toFixed(1)) },
    ]
    downloadCsv(`attendance-report-${params.group_by}-${todayISO()}.csv`, toCsv(cols, rows))
  }

  function show() {
    clear(result)
    const summary = data?.summary ?? {}
    const rows = data?.rows ?? []
    const chartData = rows.slice(0, 14).map((r) => ({ label: String(r.label ?? r.name ?? ''), present: r.present, late: r.late, absent: r.absent, excused: r.excused }))
    const tableBox = el('div')
    renderDataTable(tableBox, { columns, rows, emptyTitle: 'No attendance data', emptyText: 'No records match these filters.' })

    result.append(
      el('section', { class: 'rp-stats', 'aria-label': t('Summary') },
        statCard({ label: 'Attendance rate', value: summary.attendance_rate != null ? fmtPercent(summary.attendance_rate) : null }),
        statCard({ label: 'Present', value: summary.present ?? null }), statCard({ label: 'Late', value: summary.late ?? null }),
        statCard({ label: 'Absent', value: summary.absent ?? null }), statCard({ label: 'Excused', value: summary.excused ?? null })),
      chartData.length ? el('section', { class: 'card rp-pad rp-gap' }, el('h2', {}, t('Breakdown')), attendanceBarChart(chartData)) : null,
      el('div', { class: 'rp-export' }, el('button', { class: 'btn', type: 'button', disabled: !rows.length, onclick: exportCsv }, icon('download'), t('Export CSV'))),
      el('section', { class: 'card rp-gap' }, tableBox))
  }

  async function generate() {
    setBusy(true)
    try {
      const body = await api.get(path, params)
      data = body?.data ?? body
      show()
    } catch (error) {
      clear(result).append(el('div', { class: 'card rp-gap' }, errorState({ title: 'Could not generate the report', message: error.message, onRetry: generate })))
    } finally { setBusy(false) }
  }
  generateBtn.addEventListener('click', generate)

  clear(result).append(el('div', { class: 'card rp-gap' }, emptyState({ icon: 'bar-chart-line', title: 'No report yet', description: 'Pick the filters you need and press Generate report.' })))
}
