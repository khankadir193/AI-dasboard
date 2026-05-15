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

export function TableEmptyState({ onClearFilters, onInvite }) {
  return (
    <tr className="h-[360px]">
      <td colSpan={8} className="h-full">
        <div className="max-w-xl mx-auto flex flex-col items-center justify-center h-full py-10 px-4 text-center">
          <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
            <Users2 size={22} className="text-gray-400" />
          </div>

          <p className="text-gray-900 dark:text-white font-semibold text-base mb-1">
            No users in this workspace
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
            Invite teammates to collaborate. You can manage roles and access permissions from the table.
          </p>

          {onInvite ? (
            <button
              onClick={onInvite}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Invite Member
            </button>
          ) : (
            <button
              onClick={onClearFilters}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}

