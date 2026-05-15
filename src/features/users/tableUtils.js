/**
 * Utility functions for Users DataTable
 */

import { AVATAR_GRADIENTS, ROLE_COLORS, STATUS_COLORS } from './tableConstants'

/**
 * Generate display name from email
 */
export const generateDisplayName = (email, displayName) => {
  return (
    displayName ||
    email
      ?.split('@')?.[0]
      ?.replace(/[._-]/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase()) ||
    'Unknown'
  )
}

/**
 * Generate initials from display name
 */
export const generateInitials = (displayName) => {
  return (
    displayName
      ?.split(' ')
      ?.map(n => n[0])
      ?.join('')
      ?.slice(0, 2)
      ?.toUpperCase() || 'U'
  )
}

/**
 * Format date to localized string
 */
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  } catch {
    return 'N/A'
  }
}

/**
 * Normalize role name (handle case variations)
 */
export const normalizeRole = (rawRole) => {
  if (!rawRole) return 'Viewer'
  return rawRole.charAt(0).toUpperCase() + rawRole.slice(1).toLowerCase()
}

/**
 * Get CSS class for role badge
 */
export const getRoleClass = (role) => {
  const roleKey = role?.toLowerCase() || 'viewer'
  return ROLE_COLORS[roleKey] || ROLE_COLORS['viewer']
}

/**
 * Get CSS class for status badge
 */
export const getStatusClass = (status) => {
  return STATUS_COLORS[status] || STATUS_COLORS['Active']
}


/**
 * Get avatar gradient based on index
 */
export const getAvatarGradient = (index) => {
  return AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length]
}

/**
 * Format users from raw API data
 */
export const formatUsers = (rawUsers) => {
  if (!rawUsers || !Array.isArray(rawUsers)) return []

  return rawUsers.map((user, index) => {
    const email = user?.email || ''
    const displayName = generateDisplayName(email, user?.displayName)
    const initials = generateInitials(displayName)
    const normalizedRole = normalizeRole(user?.role)
    const isActive = user?.is_active !== false
    const status = isActive ? 'Active' : 'Inactive'
    const joinedAt = formatDate(user?.created_at)
    const avatarGradient = getAvatarGradient(index)
    const companyName = user?.company?.name || 'No Company'

    return {
      ...user,
      formattedId: `#USR-${String(1001 + index).padStart(4, '0')}`,
      displayName,
      initials,
      role: normalizedRole,
      roleClass: getRoleClass(user?.role),
      status,
      statusClass: getStatusClass(status),
      joinedAt,
      avatarGradient,
      companyName,
      email,
      isActive
    }
  })
}

/**
 * Build export data from filtered users
 */
export const buildExportData = (users, columns) => {
  return users.map(user => {
    const row = {}
    columns.forEach(col => {
      row[col.label] = user?.[col.key] || 'N/A'
    })
    return row
  })
}

/**
 * Compare two values for sorting
 */
export const compareValues = (aVal, bVal, sortDir) => {
  if (typeof aVal === 'string') aVal = aVal.toLowerCase()
  if (typeof bVal === 'string') bVal = bVal.toLowerCase()

  if (aVal < bVal) return sortDir === 'asc' ? -1 : 1
  if (aVal > bVal) return sortDir === 'asc' ? 1 : -1
  return 0
}

/**
 * Get sort value for a user field
 */
export const getSortValue = (user, sortField) => {
  switch (sortField) {
    case 'formattedId':
      return user?.id || 0
    case 'user':
      return user?.displayName || ''
    case 'email':
      return user?.email || ''
    case 'company':
      return user?.companyName || ''
    case 'role':
      return user?.role || ''
    case 'status':
      return user?.status || ''
    case 'joinedAt':
      return user?.created_at || ''
    default:
      return user?.[sortField] || ''
  }
}

/**
 * Check if date is within range
 */
export const isDateInRange = (dateString, startDate, endDate) => {
  if (!dateString) return false
  const userDate = new Date(dateString)
  if (startDate && userDate < new Date(startDate)) return false
  if (endDate && userDate > new Date(endDate)) return false
  return true
}
