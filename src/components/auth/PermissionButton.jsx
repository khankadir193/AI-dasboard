import { forwardRef, useCallback } from 'react'
import Button from '../ui/Button'
import { usePermission } from '../../hooks/usePermission'

/**
 * Permission-aware button that disables itself when the user lacks permission.
 *
 * Behavior:
 * - Disabled (not hidden) when unauthorized or while profile is loading
 * - Shows tooltip on hover explaining why it's disabled
 * - Prevents onClick execution even if triggered programmatically
 * - Forwards refs and all other props to the underlying Button
 */
const PermissionButton = forwardRef((
  {
    requiredPermission,
    requiredRole,
    requiredAny,
    requiredAll,
    tooltipText,
    onClick,
    disabled,
    loading,
    children,
    ...props
  },
  ref
) => {
  const { isAllowed, isLoading: permissionLoading, tooltip } = usePermission({
    requiredPermission,
    requiredRole,
    requiredAny,
    requiredAll,
    tooltipText,
  })

  const isDisabled = disabled || loading || permissionLoading || !isAllowed

  const handleClick = useCallback(
    (e) => {
      if (isDisabled) {
        e.preventDefault()
        e.stopPropagation()
        return
      }
      onClick?.(e)
    },
    [isDisabled, onClick]
  )

  const button = (
    <Button
      ref={ref}
      {...props}
      disabled={isDisabled}
      loading={loading}
      onClick={handleClick}
    >
      {children}
    </Button>
  )

  // Wrap disabled buttons in a span so the tooltip still shows on hover
  // (disabled elements don't fire mouse events in some browsers)
  if (isDisabled && tooltip) {
    return (
      <span
        className="inline-block"
        title={tooltip}
        style={{ cursor: 'not-allowed' }}
      >
        {button}
      </span>
    )
  }

  return button
})

PermissionButton.displayName = 'PermissionButton'

export default PermissionButton

