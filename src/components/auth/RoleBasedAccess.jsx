import { useSelector } from 'react-redux'

export function RoleBasedAccess({ 
  children, 
  roles = [], 
  permissions = [], 
  fallback = null,
  requireAll = false 
}) {
  const { permissions: userPermissions } = useSelector((state) => state.profile)

  // Check if user has required role
  const hasRole = roles.length === 0 || roles.some(role => 
    userPermissions.includes(`role_${role}`)
  )

  // Check if user has required permissions
  const hasPermission = permissions.length === 0 || (
    requireAll 
      ? permissions.every(permission => userPermissions.includes(permission))
      : permissions.some(permission => userPermissions.includes(permission))
  )

  // Render children or fallback
  if (hasRole && hasPermission) {
    return children
  }

  return fallback || null
}

// Specific permission components for common use cases
export function CanViewDashboard({ children, fallback }) {
  return (
    <RoleBasedAccess 
      permissions={['view_dashboard']} 
      fallback={fallback}
    >
      {children}
    </RoleBasedAccess>
  )
}

export function CanManageUsers({ children, fallback }) {
  return (
    <RoleBasedAccess 
      permissions={['manage_users']} 
      fallback={fallback}
    >
      {children}
    </RoleBasedAccess>
  )
}

export function CanManageTenant({ children, fallback }) {
  return (
    <RoleBasedAccess 
      permissions={['manage_tenant']} 
      fallback={fallback}
    >
      {children}
    </RoleBasedAccess>
  )
}

export function CanExportData({ children, fallback }) {
  return (
    <RoleBasedAccess 
      permissions={['export_data']} 
      fallback={fallback}
    >
      {children}
    </RoleBasedAccess>
  )
}

export function CanDeleteData({ children, fallback }) {
  return (
    <RoleBasedAccess 
      permissions={['delete_data']} 
      fallback={fallback}
    >
      {children}
    </RoleBasedAccess>
  )
}

export function CanDeleteProject({ children, fallback }) {
  return (
    <RoleBasedAccess 
      permissions={['delete_data']} 
      fallback={fallback}
    >
      {children}
    </RoleBasedAccess>
  )
}

export function AdminOnly({ children, fallback }) {
  return (
    <RoleBasedAccess 
      permissions={['manage_users', 'manage_tenant']} 
      requireAll={true}
      fallback={fallback}
    >
      {children}
    </RoleBasedAccess>
  )
}
