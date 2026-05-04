/**
 * GuardedIconButton - Icon button with permission guard
 * Displays disabled state + tooltip when user lacks permission
 * EXACT same logic as before
 */
export default function GuardedIconButton({
  onClick,
  disabled,
  isAllowed,
  tooltip,
  className,
  children,
  ariaLabel
}) {
  const isDisabled = disabled || !isAllowed

  const handleClick = (e) => {
    if (isDisabled) {
      e.preventDefault()
      e.stopPropagation()
      return
    }
    onClick(e)
  }

  const button = (
    <button
      onClick={handleClick}
      disabled={isDisabled}
      className={className}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  )

  if (isDisabled && tooltip) {
    return (
      <span className="inline-block" title={tooltip} style={{ cursor: 'not-allowed' }}>
        {button}
      </span>
    )
  }

  return button
}
