// Common types used throughout the application

// User and Authentication Types
export const UserRoles = {
  ADMIN: 'admin',
  USER: 'user', 
  VIEWER: 'viewer'
}

export const UserPermissions = {
  READ_DATA: 'read_data',
  WRITE_DATA: 'write_data',
  DELETE_DATA: 'delete_data',
  MANAGE_USERS: 'manage_users',
  VIEW_ANALYTICS: 'view_analytics',
  MANAGE_SETTINGS: 'manage_settings'
}

// API Response Types
export const ApiResponseStatus = {
  SUCCESS: 'success',
  ERROR: 'error',
  LOADING: 'loading'
}

// Project Status Types
export const ProjectStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive', 
  ARCHIVED: 'archived'
}

// Company Status Types
export const CompanyStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  TRIAL: 'trial',
  EXPIRED: 'expired'
}

// Common Data Types
export const DataTypes = {
  STRING: 'string',
  NUMBER: 'number',
  BOOLEAN: 'boolean',
  ARRAY: 'array',
  OBJECT: 'object'
}

// Validation Types
export const ValidationRules = {
  REQUIRED: 'required',
  EMAIL: 'email',
  MIN_LENGTH: 'min_length',
  MAX_LENGTH: 'max_length',
  PATTERN: 'pattern'
}

// UI State Types
export const UIStates = {
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
  IDLE: 'idle'
}

// Theme Types
export const ThemeModes = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system'
}

// Export all types as an object for easy access
export const Types = {
  UserRoles,
  UserPermissions,
  ApiResponseStatus,
  ProjectStatus,
  CompanyStatus,
  DataTypes,
  ValidationRules,
  UIStates,
  ThemeModes
}
