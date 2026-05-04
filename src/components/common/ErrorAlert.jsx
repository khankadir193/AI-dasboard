import { X } from 'lucide-react'

/**
 * ErrorAlert - Inline error message with close button
 * For displaying validation errors and inline alerts
 */
export default function ErrorAlert({ message, onClose }) {
  if (!message) return null

  return (
    <div className="p-3 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded-lg flex items-center justify-between">
      <p className="text-red-700 dark:text-red-300 text-sm">{message}</p>
      <button
        onClick={onClose}
        className="text-red-700 dark:text-red-300 hover:text-red-900 dark:hover:text-red-100"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
