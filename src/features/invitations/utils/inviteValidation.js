// Normalization utilities
export const normalizeRole = (role) => String(role || '').toLowerCase().trim()
export const normalizeEmail = (email) => String(email || '').trim().toLowerCase()

// Valid roles for invitations
const INVITE_ROLES = new Set(['admin', 'manager', 'analyst', 'viewer'])

/**
 * Normalize and validate role from invitation
 * Falls back to 'viewer' if invalid
 * @param {string} role
 * @returns {string} - Normalized role
 */
export const normalizeInvitedRole = (role) => {
  const r = normalizeRole(role)
  return INVITE_ROLES.has(r) ? r : 'viewer'
}

/**
 * Check if an invitation has expired
 * @param {string|Date} expiresAt - Expiration date
 * @returns {boolean}
 */
export const isInviteExpired = (expiresAt) => {
  if (!expiresAt) return false
  const d = new Date(expiresAt)
  return Number.isNaN(d.getTime()) ? false : d.getTime() < Date.now()
}

/**
 * Get error message if invite is not available for acceptance
 * @param {Object|null} inviteRow - The invite record
 * @returns {string} - Error message (empty if valid)
 */
export const getInviteAvailabilityError = (row) => {
  if (!row) return 'Invalid invite link.'
  if (isInviteExpired(row?.expires_at)) return 'This invitation link has expired.'
  if (row?.status === 'accepted') return 'This invitation has already been accepted.'
  if (row?.status !== 'pending') return 'This invitation is not valid anymore.'
  return ''
}

/**
 * Check if error is due to user already being registered
 * @param {string} message - Error message
 * @returns {boolean}
 */
export const isAlreadyRegisteredError = (message) => {
  const normalized = String(message || '').toLowerCase()
  return normalized.includes('already registered') || normalized.includes('user already exists')
}

/**
 * Validate password strength
 * Requires: 6+ chars, at least 1 uppercase, 1 lowercase, 1 number
 * @param {string} password
 * @returns {string} - Error message (empty if valid)
 */
export const validatePasswordStrength = (password) => {
  if (!password || password.length < 6) {
    return 'Password must be at least 6 characters'
  }
  const hasUpperCase = /[A-Z]/.test(password)
  const hasLowerCase = /[a-z]/.test(password)
  const hasNumber = /\d/.test(password)
  if (!hasUpperCase || !hasLowerCase || !hasNumber) {
    return 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
  }
  return ''
}
