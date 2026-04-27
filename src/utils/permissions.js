/**
 * Centralized Role-Based Access Control (RBAC) permissions system.
 *
 * Roles:
 * - admin:   full access
 * - manager: create + update
 * - analyst: view only
 * - viewer:  view only
 */

export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  ANALYST: 'analyst',
  VIEWER: 'viewer',
}

export const PERMISSIONS = {
  // Projects
  PROJECTS_CREATE: 'projects:create',
  PROJECTS_UPDATE: 'projects:update',
  PROJECTS_DELETE: 'projects:delete',
  PROJECTS_VIEW: 'projects:view',

  // Analytics & Dashboard
  ANALYTICS_VIEW: 'analytics:view',
  DASHBOARD_VIEW: 'dashboard:view',
  DATA_EXPORT: 'data:export',

  // AI Insights
  AI_INSIGHTS_VIEW: 'ai:view',

  // Settings
  SETTINGS_VIEW: 'settings:view',
  SETTINGS_MANAGE: 'settings:manage',

  // Users & Tenant
  USERS_MANAGE: 'users:manage',
  TENANT_MANAGE: 'tenant:manage',
}

/**
 * Maps each role to its granted permissions.
 */
export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: Object.values(PERMISSIONS),

  [ROLES.MANAGER]: [
    PERMISSIONS.PROJECTS_CREATE,
    PERMISSIONS.PROJECTS_UPDATE,
    PERMISSIONS.PROJECTS_VIEW,
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.AI_INSIGHTS_VIEW,
    PERMISSIONS.SETTINGS_VIEW,
    PERMISSIONS.SETTINGS_MANAGE,
    PERMISSIONS.DATA_EXPORT,
    PERMISSIONS.USERS_MANAGE,
    PERMISSIONS.TENANT_MANAGE,
  ],

  [ROLES.ANALYST]: [
    PERMISSIONS.PROJECTS_VIEW,
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.AI_INSIGHTS_VIEW,
    PERMISSIONS.SETTINGS_VIEW,
    PERMISSIONS.DATA_EXPORT,
  ],

  [ROLES.VIEWER]: [
    PERMISSIONS.PROJECTS_VIEW,
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.AI_INSIGHTS_VIEW,
    PERMISSIONS.SETTINGS_VIEW,
  ],
}

/**
 * Returns the list of permissions for a given role.
 * Safe fallback: returns empty array for unknown or null roles.
 *
 * @param {string|null|undefined} role
 * @returns {string[]}
 */
export function getRolePermissions(role) {
  if (!role || typeof role !== 'string') return []
  return ROLE_PERMISSIONS[role] || []
}

/**
 * Checks if a role has a specific permission.
 * Safe fallback: returns false for unknown or null inputs.
 *
 * @param {string|null|undefined} role
 * @param {string|null|undefined} permission
 * @returns {boolean}
 */
export function hasPermission(role, permission) {
  if (!role || !permission) return false
  const permissions = getRolePermissions(role)
  return permissions.includes(permission)
}

/**
 * Checks if a role has any of the specified permissions.
 *
 * @param {string|null|undefined} role
 * @param {string[]} permissions
 * @returns {boolean}
 */
export function hasAnyPermission(role, permissions) {
  if (!role || !Array.isArray(permissions)) return false
  return permissions.some((p) => hasPermission(role, p))
}

/**
 * Checks if a role has all of the specified permissions.
 *
 * @param {string|null|undefined} role
 * @param {string[]} permissions
 * @returns {boolean}
 */
export function hasAllPermissions(role, permissions) {
  if (!role || !Array.isArray(permissions)) return false
  return permissions.every((p) => hasPermission(role, p))
}

/**
 * Returns a human-readable tooltip message for a missing permission.
 * Shows role-based messages when the permission is restricted.
 *
 * @param {string|null|undefined} permission
 * @returns {string}
 */
export function getPermissionTooltip(permission) {
  if (!permission) return 'You do not have permission to perform this action'

  const rolesWithPermission = Object.entries(ROLE_PERMISSIONS)
    .filter(([, permissions]) => permissions.includes(permission))
    .map(([role]) => role)

  if (rolesWithPermission.length === 1 && rolesWithPermission[0] === ROLES.ADMIN) {
    return 'Admin only'
  }

  if (
    rolesWithPermission.length === 2 &&
    rolesWithPermission.includes(ROLES.ADMIN) &&
    rolesWithPermission.includes(ROLES.MANAGER)
  ) {
    return 'Admin or Manager only'
  }

  return `Requires permission: ${permission}`
}

