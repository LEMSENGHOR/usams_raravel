import { createResource } from '@/api/resource'
import { endpoints } from '@/modules/config/endpoints'
import { newestFirst } from '@/modules/utils/helpers'
// Builds the admin dashboard figures from the list endpoints that already work (students, lecturers, classes ...).
// Used when the API has no dashboard endpoint. It only READS data; nothing in the backend changes.
const MAX_PAGES = 50

async function readAll(path) {
  const items = []
  let page = 1
  let lastPage = 1
  do {
    const result = await createResource(path).list({ page, per_page: 100 })
    items.push(...result.items)
    lastPage = result.lastPage
    page += 1
  } while (page <= lastPage && page <= MAX_PAGES)
  return items
}

const total = async (path) => (await createResource(path).list({ per_page: 1 })).total
// const recent = async (path, n = 5) => (await createResource(path).list({ per_page: n })).items

// Newest records: read the first page and the last two pages (the API may list oldest-first or newest-first),
// then sort by date. The last two pages matter because the very last page can hold fewer than n rows.
async function recent(path, n = 5) {
  const first = await createResource(path).list({ page: 1, per_page: n })
  const items = [...first.items]
  for (const page of [first.lastPage - 1, first.lastPage]) {
    if (page > 1) items.push(...(await createResource(path).list({ page, per_page: n })).items)
  }
  return items.sort(newestFirst).slice(0, n)
}

const isActive = (item) => String(item.status ?? 'ACTIVE').toUpperCase() === 'ACTIVE'
const ok = (settled) => (settled.status === 'fulfilled' ? settled.value : null)

export async function buildAdminDashboard() {
  const [students, lecturers, classes, subjects, sessions, years, semesters, recentSessions, recentStudents, recentLecturers] = (await Promise.allSettled([
    total(endpoints.students),
    total(endpoints.lecturers),
    readAll(endpoints.classes),
    readAll(endpoints.subjects),
    total(endpoints['attendance-sessions']),
    readAll(endpoints['academic-years']),
    readAll(endpoints.semesters),
    recent(endpoints['attendance-sessions']),
    recent(endpoints.students),
    recent(endpoints.lecturers),
  ])).map(ok)

  if ([students, lecturers, classes, subjects, sessions].every((v) => v === null)) {
    throw { status: 404, message: 'None of the list endpoints used by the dashboard could be loaded.' }
  }
  return {
    total_students: students,
    total_lecturers: lecturers,
    active_classes: classes ? classes.filter(isActive).length : null,
    active_subjects: subjects ? subjects.filter(isActive).length : null,
    attendance_sessions: sessions,
    // attendance_rate and the chart need attendance records; they stay empty until an endpoint provides them
    recent_sessions: recentSessions ?? [],
    recent_students: recentStudents ?? [],
    recent_lecturers: recentLecturers ?? [],
    current_academic_year: years?.find((y) => y.is_current || String(y.status).toUpperCase() === 'ACTIVE') ?? null,
    current_semester: semesters?.find((s) => String(s.status).toUpperCase() === 'ACTIVE') ?? null,
  }
}