/**
 * RBAC slugs from GET /auth/me (`user.permissions`). Super-admin receives ['*'].
 */
export function hasPermission(permissions, slug) {
  if (!Array.isArray(permissions) || permissions.length === 0) return false
  if (permissions.includes('*')) return true
  return permissions.includes(slug)
}
