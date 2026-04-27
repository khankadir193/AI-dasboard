import { useSelector } from 'react-redux'
import { hasPermission as checkPermission, PERMISSIONS } from '../../utils/permissions'

export function RoleBasedAccess({
  children,
  roles = [],
  permissions = [],
  fallback = null,
  requireAll = false
}) {
  const { profile } = useSelector((state) => state.profile)
  const userRole = profile?.role ?? null

  // Check if user has required role
  const hasRole = roles.length === 0 || roles.some((role) => role === userRole)

  // Check if user has required permissions
  const hasPerm = permissions.length === 0 || (
    requireAll
      ? permissions.every((permission) => checkPermission(userRole, permission))
      : permissions.some((permission) => checkPermission(userRole, permission))
  )

  // Render children or fallback
  if (hasRole && hasPerm) {
    return children
  }

  return fallback || null
}

// Specific permission components for common use cases
export function CanViewDashboard({ children, fallback }) {
  return (
    <RoleBasedAccess
      permissions={[PERMISSIONS.DASHBOARD_VIEW]}
      fallback={fallback}
    >
      {children}
    </RoleBasedAccess>
  )
}

export function CanManageUsers({ children, fallback }) {
  return (
    <RoleBasedAccess
      permissions={[PERMISSIONS.USERS_MANAGE]}
      fallback={fallback}
    >
      {children}
    </RoleBasedAccess>
  )
}

export function CanManageTenant({ children, fallback }) {
  return (
    <RoleBasedAccess
      permissions={[PERMISSIONS.TENANT_MANAGE]}
      fallback={fallback}
    >
      {children}
    </RoleBasedAccess>
  )
}

export function CanExportData({ children, fallback }) {
  return (
    <RoleBasedAccess
      permissions={[PERMISSIONS.DATA_EXPORT]}
      fallback={fallback}
    >
      {children}
    </RoleBasedAccess>
  )
}

export function CanDeleteData({ children, fallback }) {
  return (
    <RoleBasedAccess
      permissions={[PERMISSIONS.PROJECTS_DELETE]}
      fallback={fallback}
    >
      {children}
    </RoleBasedAccess>
  )
}

export function CanDeleteProject({ children, fallback }) {
  return (
    <RoleBasedAccess
      permissions={[PERMISSIONS.PROJECTS_DELETE]}
      fallback={fallback}
    >
      {children}
    </RoleBasedAccess>
  )
}

export function AdminOnly({ children, fallback }) {
  return (
    <RoleBasedAccess
      permissions={[PERMISSIONS.USERS_MANAGE, PERMISSIONS.TENANT_MANAGE]}
      requireAll={true}
      fallback={fallback}
    >
      {children}
    </RoleBasedAccess>
  )
}
