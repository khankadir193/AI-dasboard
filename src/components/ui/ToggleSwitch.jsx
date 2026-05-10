import { forwardRef } from 'react'

const ToggleSwitch = forwardRef(({ checked, onChange, disabled, label, description, className = '' }, ref) => {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (!disabled) {
        onChange(!checked)
      }
    }
  }

  return (
    <button
      ref={ref}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label || 'Toggle'}
      tabIndex={0}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      onKeyDown={handleKeyDown}
      className={`
        relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent 
        rounded-full cursor-pointer transition-colors duration-200 ease-in-out
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 
        focus-visible:ring-offset-2 focus-visible:ring-offset-white
        dark:focus-visible:ring-offset-gray-900
        ${checked ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-700'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
    >
      <span
        aria-hidden="true"
        className={`
          pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm 
          transform ring-0 transition-transform duration-200 ease-in-out
          ${checked ? 'translate-x-5' : 'translate-x-0'}
        `}
      />
    </button>
  )
})

ToggleSwitch.displayName = 'ToggleSwitch'

export default ToggleSwitch
