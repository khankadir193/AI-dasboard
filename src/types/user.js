// User-related type definitions

// User Profile Structure
export const UserProfile = {
  id: 'string', // UUID
  role: 'string', // admin, user, viewer
  permissions: 'array', // Array of permission strings
  company_id: 'string', // UUID
  created_at: 'string' // ISO date
}

import {
  ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  getRolePermissions,
  hasPermission as _hasPermission,
  hasAnyPermission as _hasAnyPermission,
  hasAllPermissions as _hasAllPermissions,
} from '../utils/permissions'

// Re-export for backward compatibility
export { PERMISSIONS, ROLE_PERMISSIONS, getRolePermissions }

// User Roles and Permissions (backward-compatible aliases)
export const UserRoles = ROLES

export const RolePermissions = ROLE_PERMISSIONS

// User Validation Rules
export const UserValidation = {
  EMAIL: {
    required: true,
    type: 'email',
    maxLength: 255
  },
  PASSWORD: {
    required: true,
    minLength: 6,
    maxLength: 128,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/ // At least one lowercase, one uppercase, one number
  },
}

// User Session Structure
export const UserSession = {
  user: UserProfile,
  access_token: 'string',
  refresh_token: 'string',
  expires_at: 'number', // Timestamp
  expires_in: 'number' // Seconds
}

// User Preferences
export const UserPreferences = {
  theme: 'string', // light, dark, system
  language: 'string', // en, es, fr, etc.
  timezone: 'string', // UTC, America/New_York, etc.
  notifications: 'object', // Notification settings
  dashboard_layout: 'object' // Dashboard customization
}

// User Activity Tracking
export const UserActivity = {
  id: 'string',
  user_id: 'string',
  action: 'string', // login, logout, create, update, delete
  resource: 'string', // project, user, company, etc.
  resource_id: 'string',
  metadata: 'object',
  ip_address: 'string',
  user_agent: 'string',
  created_at: 'string'
}

// Helper Functions (backward-compatible wrappers)
export const hasPermission = (userRole, permission) => _hasPermission(userRole, permission)

export const hasAnyPermission = (userRole, permissions) => _hasAnyPermission(userRole, permissions)

export const hasAllPermissions = (userRole, permissions) => _hasAllPermissions(userRole, permissions)

export const isAdmin = (userRole) => userRole === ROLES.ADMIN
export const canManageUsers = (userRole) => _hasPermission(userRole, PERMISSIONS.USERS_MANAGE)
export const canDeleteData = (userRole) => _hasPermission(userRole, PERMISSIONS.PROJECTS_DELETE)
