// User-related type definitions

// User Profile Structure
export const UserProfile = {
  id: 'string', // UUID
  role: 'string', // admin, user, viewer
  permissions: 'array', // Array of permission strings
  company_id: 'string', // UUID
  created_at: 'string' // ISO date
}

// User Roles and Permissions
export const UserRoles = {
  ADMIN: 'admin',
  USER: 'user',
  VIEWER: 'viewer'
}

export const RolePermissions = {
  [UserRoles.ADMIN]: [
    'read_data',
    'write_data', 
    'delete_data',
    'manage_users',
    'view_analytics',
    'manage_settings'
  ],
  [UserRoles.USER]: [
    'read_data',
    'write_data',
    'delete_data',
    'view_analytics'
  ],
  [UserRoles.VIEWER]: [
    'read_data',
    'view_analytics'
  ]
}

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
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value) // At least one lowercase, one uppercase, one number
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

// Helper Functions
export const hasPermission = (userRole, permission) => {
  return RolePermissions[userRole]?.includes(permission) || false
}

export const hasAnyPermission = (userRole, permissions) => {
  const userPermissions = RolePermissions[userRole] || []
  return permissions.some(permission => userPermissions.includes(permission))
}

export const hasAllPermissions = (userRole, permissions) => {
  const userPermissions = RolePermissions[userRole] || []
  return permissions.every(permission => userPermissions.includes(permission))
}

export const isAdmin = (userRole) => userRole === UserRoles.ADMIN
export const canManageUsers = (userRole) => hasPermission(userRole, 'manage_users')
export const canDeleteData = (userRole) => hasPermission(userRole, 'delete_data')
