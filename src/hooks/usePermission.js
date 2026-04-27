import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getPermissionTooltip,
} from '../utils/permissions'

/**
 * Hook for checking permissions against the current user's Redux profile.
 *
 * @param {Object} options
 * @param {string} [options.requiredPermission] - Single permission to check
 * @param {string} [options.requiredRole] - Specific role required
 * @param {string[]} [options.requiredAny] - Any of these permissions required
 * @param {string[]} [options.requiredAll] - All of these permissions required
 * @param {string} [options.tooltipText] - Custom tooltip text when disallowed
 *
 * @returns {{ isAllowed: boolean, isLoading: boolean, role: string|null, tooltip: string|undefined }}
 */
export function usePermission(options = {}) {
  const {
    requiredPermission,
    requiredRole,
    requiredAny,
    requiredAll,
    tooltipText,
  } = options

  const { profile: profileFromProfile, isLoading: profileLoading } = useSelector((state) => state.profile)
  const { profile: profileFromAuth, isLoading: authLoading } = useSelector((state) => state.auth)

  const profile = profileFromProfile ?? profileFromAuth ?? null
  const isLoading = profileLoading || authLoading
  const role = profile?.role ?? null

  const isAllowed = useMemo(() => {
    if (isLoading) return false
    if (!role) return false
    if (requiredRole && role !== requiredRole) return false
    if (requiredPermission && !hasPermission(role, requiredPermission)) return false
    if (requiredAny && !hasAnyPermission(role, requiredAny)) return false
    if (requiredAll && !hasAllPermissions(role, requiredAll)) return false
    return true
  }, [isLoading, role, requiredRole, requiredPermission, requiredAny, requiredAll])

  const tooltip = useMemo(() => {
    if (isLoading) return 'Loading permissions...'
    if (!role) return 'Authentication required'
    if (!isAllowed) return tooltipText || getPermissionTooltip(requiredPermission)
    return undefined
  }, [isLoading, role, isAllowed, tooltipText, requiredPermission])

  return {
    isAllowed,
    isLoading,
    role,
    tooltip,
  }
}

export default usePermission

