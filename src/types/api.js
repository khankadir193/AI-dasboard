// API response and request types

// Base API Response
export const ApiResponse = {
  SUCCESS: 'success',
  ERROR: 'error',
  PENDING: 'pending'
}

// HTTP Status Codes
export const HttpStatus = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
}

// API Error Types
export const ApiErrorTypes = {
  VALIDATION_ERROR: 'validation_error',
  AUTHENTICATION_ERROR: 'authentication_error',
  AUTHORIZATION_ERROR: 'authorization_error',
  NOT_FOUND_ERROR: 'not_found_error',
  CONFLICT_ERROR: 'conflict_error',
  SERVER_ERROR: 'server_error',
  NETWORK_ERROR: 'network_error'
}

// Request Configuration
export const RequestConfig = {
  TIMEOUT: 10000, // 10 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000 // 1 second
}

// Pagination Types
export const Pagination = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  DEFAULT_PAGE: 1
}

// Sort Directions
export const SortDirection = {
  ASC: 'asc',
  DESC: 'desc'
}

// Filter Operators
export const FilterOperators = {
  EQUALS: 'eq',
  NOT_EQUALS: 'neq',
  GREATER_THAN: 'gt',
  GREATER_THAN_OR_EQUAL: 'gte',
  LESS_THAN: 'lt',
  LESS_THAN_OR_EQUAL: 'lte',
  CONTAINS: 'like',
  IN: 'in',
  NOT_IN: 'not_in'
}

// Response Transformers
export const ResponseTransformers = {
  CAMEL_CASE: 'camelCase',
  SNAKE_CASE: 'snakeCase',
  KEBAB_CASE: 'kebabCase'
}

// Cache Configuration
export const CacheConfig = {
  DEFAULT_TTL: 300000, // 5 minutes
  LONG_TTL: 3600000, // 1 hour
  SHORT_TTL: 60000, // 1 minute
  MAX_SIZE: 100 // Max cached items
}
