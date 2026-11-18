/**
 * EVERY API path lives here. These follow Laravel REST conventions and are
 * ASSUMPTIONS until checked against `php artisan route:list`. Edit once, whole app follows.
 * Paths are relative to the API base ("/api"), which Blade passes in window.USAMS.apiBase.
 */
export const endpoints = {
  auth: { login: '/auth/login', logout: '/auth/logout', me: '/auth/me' },
  faculties: '/faculties',
  departments: '/departments',
  majors: '/majors',
  'academic-years': '/academic-years',
  semesters: '/semesters',
  students: '/students',
  lecturers: '/lecturers',
  classes: '/classes',
  subjects: '/subjects',
  assignments: '/class-subjects',
  enrollments: '/enrollments',
  timetables: '/timetables',
  'attendance-sessions': '/attendance-sessions',
  'attendance-records': '/attendance-records',
  users: '/users',
  adminDashboard: '/admin/dashboard',
  adminReport: '/reports/attendance',
  lecturer: {
    dashboard: '/lecturer/dashboard',
    assignments: '/lecturer/class-subjects',
    timetables: '/lecturer/timetables',
    // sessions: '/lecturer/attendance-sessions',
    sessions: '/attendance-sessions',
    report: '/lecturer/reports/attendance',
    profile: '/lecturer/profile',
    password: '/auth/password',
  },
}

// Features the spec says to build only if the backend supports them. Turn on here (they were VITE_* env flags in the Vue app).
export const features = {
  markAllPresent: false,
  attendanceNotes: false,
  passwordChange: false,
}

// Day values the timetable API uses. Change if your backend stores numbers or other codes.
// export const DAYS = [
//   { value: 'MONDAY', label: 'Monday' }, { value: 'TUESDAY', label: 'Tuesday' },
//   { value: 'WEDNESDAY', label: 'Wednesday' }, { value: 'THURSDAY', label: 'Thursday' },
//   { value: 'FRIDAY', label: 'Friday' }, { value: 'SATURDAY', label: 'Saturday' },
//   { value: 'SUNDAY', label: 'Sunday' },
// ]

export const DAYS = [
    { value: 1, label: 'Monday', i18n: true },
    { value: 2, label: 'Tuesday', i18n: true },
    { value: 3, label: 'Wednesday', i18n: true },
    { value: 4, label: 'Thursday', i18n: true },
    { value: 5, label: 'Friday', i18n: true },
    { value: 6, label: 'Saturday', i18n: true },
    { value: 7, label: 'Sunday', i18n: true },
]