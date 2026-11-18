import { el } from '@/modules/utils/dom'
import { t } from '@/modules/i18n'

// data: [{ label, present, late, absent, excused }]. Drawn only from values the API returned.
const SERIES = [
  { key: 'present', label: 'Present', color: 'var(--color-success)' },
  { key: 'late', label: 'Late', color: 'var(--color-warning)' },
  { key: 'excused', label: 'Excused', color: 'var(--color-info)' },
  { key: 'absent', label: 'Absent', color: 'var(--color-danger)' },
]
const total = (d) => SERIES.reduce((sum, s) => sum + (Number(d[s.key]) || 0), 0)

/** Replaces AttendanceBarChart.vue (stacked bars + legend + a screen-reader table). */
export function attendanceBarChart(data) {
  const max = Math.max(1, ...data.map(total))
  return el('figure', { class: 'ch-chart' },
    el('div', { class: 'ch-bars', role: 'img', 'aria-label': t('Attendance by period, {n} bars', { n: data.length }) },
      data.map((d) => el('div', { class: 'ch-col' },
        el('div', { class: 'ch-stack', title: t('{label}: {n} records', { label: d.label, n: total(d) }), style: { height: `${(total(d) / max) * 100}%` } },
          SERIES.map((s) => el('span', { style: { flex: String(Number(d[s.key]) || 0), background: s.color } }))),
        el('span', { class: 'ch-lbl' }, d.label)))),
    el('figcaption', { class: 'ch-legend' }, SERIES.map((s) => el('span', {}, el('i', { style: { background: s.color } }), t(s.label)))),
    el('table', { class: 'sr-only' },
      el('thead', {}, el('tr', {}, el('th', {}, t('Period')), SERIES.map((s) => el('th', {}, t(s.label))))),
      el('tbody', {}, data.map((d) => el('tr', {}, el('td', {}, d.label), SERIES.map((s) => el('td', {}, String(d[s.key] ?? 0))))))))
}
