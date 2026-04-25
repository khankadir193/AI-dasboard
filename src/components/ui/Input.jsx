import clsx from 'clsx'
import { forwardRef } from 'react'

const Input = forwardRef(({ 
  className, 
  type = 'text', 
  error, 
  disabled = false, 
  ...props 
}, ref) => {
  const baseClasses = 'block w-full rounded-lg border px-3 py-2 text-sm placeholder-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2'
  
  const stateClasses = {
    default: 'border-gray-300 bg-white text-gray-900 focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-400 dark:disabled:bg-gray-700',
    error: 'border-red-300 bg-white text-red-900 focus:border-red-500 focus:ring-red-500 dark:border-red-600 dark:bg-gray-800 dark:text-red-100'
  }
  
  const classes = clsx(
    baseClasses,
    error ? stateClasses.error : stateClasses.default,
    disabled && 'cursor-not-allowed opacity-50',
    className
  )
  
  return (
    <input
      ref={ref}
      type={type}
      className={classes}
      disabled={disabled}
      {...props}
    />
  )
})

Input.displayName = 'Input'

export default Input
