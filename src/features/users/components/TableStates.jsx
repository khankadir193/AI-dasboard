/**
 * Table State Components - Loading, Error, Empty states
 */
import { Loader2, Users2 } from 'lucide-react'

export function TableLoadingState() {
  return (
    <tr className="h-[320px]">
      <td colSpan={8} className="text-center py-16 text-gray-400">
        <Loader2 size={24} className="animate-spin mx-auto mb-2" />
        Loading data...
      </td>
    </tr>
  )
}

export function TableErrorState({ error, onRetry }) {
  return (
    <tr className="h-[320px]">
      <td colSpan={8} className="h-full">
        <div className="flex flex-col items-center justify-center h-full py-16 px-4">
          <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
            <Users2 size={24} className="text-red-500" />
          </div>
          <p className="text-gray-900 dark:text-white font-medium mb-1">
            Error loading users
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {error?.message || 'Check console for details'}
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Try Again
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}

export function TableEmptyState({ onClearFilters }) {
  return (
    <tr className="h-[320px]">
      <td colSpan={8} className="h-full">
        <div className="flex flex-col items-center justify-center h-full py-16 px-4">
          <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
            <Users2 size={24} className="text-gray-400" />
          </div>
          <p className="text-gray-900 dark:text-white font-medium mb-1">
            No users found
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Try adjusting your search or filters.
          </p>
          <button
            onClick={onClearFilters}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </td>
    </tr>
  )
}
