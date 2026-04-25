// Application constants

export const APP_CONFIG = {
  name: import.meta.env.VITE_APP_NAME || 'AI SaaS Dashboard',
  version: import.meta.env.VITE_APP_VERSION || '1.0.0',
  apiBaseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3001'
}

export const API_ENDPOINTS = {
  // Authentication
  SIGN_IN: '/auth/signin',
  SIGN_UP: '/auth/signup',
  SIGN_OUT: '/auth/signout',
  REFRESH_TOKEN: '/auth/refresh',
  
  // User Management
  GET_PROFILE: '/user/profile',
  UPDATE_PROFILE: '/user/profile',
  CHANGE_PASSWORD: '/user/password',
  
  // Company Management
  GET_COMPANY: '/company',
  UPDATE_COMPANY: '/company',
  
  // Projects
  GET_PROJECTS: '/projects',
  CREATE_PROJECT: '/projects',
  UPDATE_PROJECT: '/projects/:id',
  DELETE_PROJECT: '/projects/:id',
  
  // Analytics
  GET_ANALYTICS: '/analytics',
  GET_KPIS: '/analytics/kpis',
  
  // AI Features
  AI_INSIGHTS: '/ai/insights',
  AI_CHAT: '/ai/chat'
}

export const ROUTES = {
  HOME: '/',
  SIGN_IN: '/signin',
  SIGN_UP: '/signup',
  DASHBOARD: '/dashboard',
  ANALYTICS: '/dashboard/analytics',
  AI_INSIGHTS: '/dashboard/ai-insights',
  DATA_TABLE: '/dashboard/data-table',
  PROJECTS: '/dashboard/projects',
  SETTINGS: '/dashboard/settings',
  NOT_FOUND: '/404'
}

export const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  VIEWER: 'viewer'
}

export const PERMISSIONS = {
  READ_DATA: 'read_data',
  WRITE_DATA: 'write_data',
  DELETE_DATA: 'delete_data',
  MANAGE_USERS: 'manage_users',
  VIEW_ANALYTICS: 'view_analytics',
  MANAGE_SETTINGS: 'manage_settings'
}

export const PROJECT_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  ARCHIVED: 'archived'
}

export const THEME = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system'
}

export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
}

export const ANIMATION_DURATIONS = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500
}

export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  XXL: 1536
}

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'Access denied. Please contact your administrator.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'Server error. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  TIMEOUT_ERROR: 'Request timed out. Please try again.'
}
