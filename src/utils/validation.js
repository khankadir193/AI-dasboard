// Validation utilities for forms and data

export const ValidationRules = {
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Please enter a valid email address'
  },
  password: {
    required: true,
    minLength: 6,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    message: 'Password must be at least 6 characters with uppercase, lowercase, and number'
  },
  name: {
    required: true,
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-Z\s'-]+$/,
    message: 'Name must be 2-50 characters, letters only'
  },
  projectName: {
    required: true,
    minLength: 1,
    maxLength: 100,
    pattern: /^[a-zA-Z0-9\s\-_]+$/,
    message: 'Project name can only contain letters, numbers, spaces, hyphens, and underscores'
  }
}

export const validateField = (value, rules) => {
  // Handle null/undefined values
  if (value === null || value === undefined) {
    if (rules.required) {
      return rules.message || 'This field is required'
    }
    return null // Optional field with no value is valid
  }

  // Convert to string if not already
  const stringValue = String(value)

  if (rules.required && stringValue.trim() === '') {
    return rules.message || 'This field is required'
  }

  if (rules.minLength && stringValue.length < rules.minLength) {
    return `Must be at least ${rules.minLength} characters`
  }

  if (rules.maxLength && stringValue.length > rules.maxLength) {
    return `Must be no more than ${rules.maxLength} characters`
  }

  if (rules.pattern && !rules.pattern.test(stringValue)) {
    return rules.message || 'Invalid format'
  }

  return null
}

export const validateForm = (data, validationSchema) => {
  // Handle null/undefined data
  if (!data || typeof data !== 'object') {
    return {
      isValid: false,
      errors: { _form: 'Invalid form data' }
    }
  }

  const errors = {}
  
  for (const [field, rules] of Object.entries(validationSchema)) {
    const error = validateField(data[field], rules)
    if (error) {
      errors[field] = error
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

export const sanitizeInput = (input) => {
  // Handle null/undefined values
  if (input === null || input === undefined) return ''
  
  if (typeof input !== 'string') {
    try {
      input = String(input)
    } catch {
      return ''
    }
  }
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential XSS
    .replace(/javascript:/gi, '') // Remove javascript protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .replace(/data:/gi, '') // Remove data protocol
    .replace(/vbscript:/gi, '') // Remove vbscript protocol
    .replace(/&lt;/gi, '') // Remove encoded HTML
    .replace(/&gt;/gi, '') // Remove encoded HTML
    .replace(/&amp;/gi, '&') // Convert encoded ampersand
    .substring(0, 1000) // Limit length
}

export const isValidUrl = (string) => {
  try {
    new URL(string)
    return true
  } catch (_) {
    return false
  }
}

export const isStrongPassword = (password) => {
  const hasUpperCase = /[A-Z]/.test(password)
  const hasLowerCase = /[a-z]/.test(password)
  const hasNumber = /\d/.test(password)
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)
  
  return {
    isValid: hasUpperCase && hasLowerCase && hasNumber && password.length >= 8,
    hasUpperCase,
    hasLowerCase,
    hasNumber,
    hasSpecialChar,
    length: password.length
  }
}
