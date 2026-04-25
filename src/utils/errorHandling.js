// Centralized error handling utilities

export class AppError extends Error {
  constructor(message, code = 'UNKNOWN_ERROR', statusCode = 500) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.statusCode = statusCode
    this.timestamp = new Date().toISOString()
  }
}

export const ErrorCodes = {
  // Authentication errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  
  // Network errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  
  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  
  // Business logic errors
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  DUPLICATE_RESOURCE: 'DUPLICATE_RESOURCE',
  OPERATION_NOT_ALLOWED: 'OPERATION_NOT_ALLOWED',
  
  // System errors
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  CONFIGURATION_ERROR: 'CONFIGURATION_ERROR'
}

export const getErrorMessage = (error) => {
  if (error instanceof AppError) {
    return error.message
  }
  
  if (error?.code) {
    switch (error.code) {
      case 'PGRST116': return 'Resource not found'
      case '42501': return 'Permission denied'
      case '23505': return 'Duplicate entry'
      case '23503': return 'Invalid reference'
      case '23514': return 'Check constraint violation'
      default: return error.message || 'An error occurred'
    }
  }
  
  if (error?.message) {
    return error.message
  }
  
  return 'An unexpected error occurred'
}

export const getErrorCode = (error) => {
  if (error instanceof AppError) {
    return error.code
  }
  
  if (error?.code) {
    switch (error.code) {
      case 'PGRST116': return ErrorCodes.RESOURCE_NOT_FOUND
      case '42501': return ErrorCodes.FORBIDDEN
      case '23505': return ErrorCodes.DUPLICATE_RESOURCE
      case '23503': return ErrorCodes.INVALID_INPUT
      case '23514': return ErrorCodes.VALIDATION_ERROR
      default: return ErrorCodes.UNKNOWN_ERROR
    }
  }
  
  if (error?.name === 'TypeError') {
    return ErrorCodes.VALIDATION_ERROR
  }
  
  if (error?.name === 'NetworkError' || error?.message?.includes('fetch')) {
    return ErrorCodes.NETWORK_ERROR
  }
  
  return ErrorCodes.UNKNOWN_ERROR
}

export const isRetryableError = (error) => {
  const code = getErrorCode(error)
  return [
    ErrorCodes.NETWORK_ERROR,
    ErrorCodes.TIMEOUT_ERROR,
    ErrorCodes.SERVER_ERROR
  ].includes(code)
}

export const createErrorLogger = (context) => {
  return (error, additionalInfo = {}) => {
    const errorInfo = {
      context,
      message: getErrorMessage(error),
      code: getErrorCode(error),
      timestamp: new Date().toISOString(),
      stack: error?.stack,
      ...additionalInfo
    }
    
    console.error(`[${context}] Error:`, errorInfo)
    
    // In production, you might want to send this to a logging service
    if (import.meta.env.PROD) {
      // Example: sendToErrorReporting(errorInfo)
    }
  }
}

export const withErrorHandling = (fn, context) => {
  const logError = createErrorLogger(context)
  
  return async (...args) => {
    try {
      return await fn(...args)
    } catch (error) {
      logError(error, { args })
      throw error
    }
  }
}

export const safeAsync = async (fn, fallbackValue = null) => {
  try {
    return await fn()
  } catch (error) {
    console.error('Async operation failed:', error)
    return fallbackValue
  }
}
