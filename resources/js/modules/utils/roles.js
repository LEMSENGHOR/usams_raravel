export const ROLES = Object.freeze({
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  LECTURER: 'LECTURER',
  STUDENT: 'STUDENT',
})

export const ADMIN_ROLES = [ROLES.SUPER_ADMIN, ROLES.ADMIN]
export const LECTURER_ROLES = [ROLES.LECTURER]

/** Home route for a role. STUDENT (or unknown) gets null: no dashboard exists for them. */
export function homeForRole(role) {
  if (ADMIN_ROLES.includes(role)) return '/admin/dashboard'
  if (LECTURER_ROLES.includes(role)) return '/lecturer/dashboard'
  return null
}

/**
 * Laravel may return the role as `role: "ADMIN"`, `role: { name: "ADMIN" }`
 * or `roles: ["ADMIN"]`. Adjust here once you have seen the real response.
 */
export function extractRole(user) {
  if (!user) return null
  const raw = user.role ?? user.roles?.[0] ?? null
  const value = typeof raw === 'object' && raw !== null ? raw.name ?? raw.code : raw
  return value ? String(value).toUpperCase() : null
}
