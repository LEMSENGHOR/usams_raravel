import { el } from '@/modules/utils/dom'
import { t } from '@/modules/i18n'

// `status` is shown exactly as the backend sends it. Unknown values render neutral,
// and a missing value renders "Not marked" (a UI state, NOT a database status).
const VARIANTS = {
  // Attendance records
  PRESENT: 'success', LATE: 'warning', ABSENT: 'danger', EXCUSED: 'info',
  // Attendance sessions
  SCHEDULED: 'info', OPEN: 'success', CLOSED: 'neutral', CANCELLED: 'danger',
  // Academic years / semesters
  UPCOMING: 'info', ACTIVE: 'success', COMPLETED: 'neutral',
  // Accounts
  INACTIVE: 'neutral', SUSPENDED: 'danger',
  // Roles
  SUPER_ADMIN: 'info', ADMIN: 'info', LECTURER: 'success', STUDENT: 'neutral',
}

export function statusBadge(status) {
  const variant = status ? VARIANTS[status] ?? 'neutral' : 'neutral'
  const label = status ? status.charAt(0) + status.slice(1).toLowerCase().replace(/_/g, ' ') : 'Not marked'
  return el('span', { class: `st-badge st-badge-${variant}${status ? '' : ' st-badge-unmarked'}` },
    el('span', { class: 'st-dot', 'aria-hidden': 'true' }), t(label))
}
