import { useState, useCallback } from 'react'
import { AlertCircle, CheckCheck, RefreshCw } from 'lucide-react'
import { useNotifications, useMarkAsRead, useMarkAllAsRead, useUnreadCount } from './hooks/useNotifications'
import NotificationItem from './components/NotificationItem'
import NotificationFilters from './components/NotificationFilters'
import NotificationSkeleton from './components/NotificationSkeleton'
import NotificationEmptyState from './components/NotificationEmptyState'
import FeatureGate from '../../components/auth/FeatureGate'

const PAGE_SIZE = 20

const PRIORITY_OPTIONS = [
  { value: '', label: 'All Priorities' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
]

const TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'project_created', label: 'Project Created' },
  { value: 'project_updated', label: 'Project Updated' },
  { value: 'project_deleted', label: 'Project Deleted' },
  { value: 'project_deadline_approaching', label: 'Deadline Approaching' },
  { value: 'user_invited', label: 'User Invited' },
  { value: 'user_joined', label: 'User Joined' },
  { value: 'high_productivity', label: 'High Productivity' },
  { value: 'low_productivity', label: 'Low Productivity' },
  { value: 'analytics_alert', label: 'Analytics Alert' },
]

const READ_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'read', label: 'Read' },
]

function NotificationsContent() {
  const [page, setPage] = useState(1)
  const [typeFilter, setTypeFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [readFilter, setReadFilter] = useState('')

  const readFilterValue = readFilter === 'unread' ? false : readFilter === 'read' ? true : undefined

  const { data, isLoading, isFetching, error, refetch } = useNotifications({
    page,
    pageSize: PAGE_SIZE,
    type: typeFilter || undefined,
    priority: priorityFilter || undefined,
    isRead: readFilterValue,
  })

  const { data: unreadCount = 0 } = useUnreadCount()
  const markAsReadMutation = useMarkAsRead()
  const markAllAsReadMutation = useMarkAllAsRead()

  const handleMarkAsRead = useCallback((id) => {
    markAsReadMutation.mutate(id)
  }, [markAsReadMutation])

  const handleMarkAllAsRead = useCallback(() => {
    if (unreadCount > 0) {
      markAllAsReadMutation.mutate()
    }
  }, [markAllAsReadMutation, unreadCount])

  const handleClearFilters = () => {
    setTypeFilter('')
    setPriorityFilter('')
    setReadFilter('')
    setPage(1)
  }

  const notifications = data?.notifications || []
  const totalCount = data?.totalCount || 0
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  const handlePageChange = (newPage) => {
    setPage(newPage)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Notifications</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}`
              : 'All caught up'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0 || markAllAsReadMutation.isPending}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-950/60 disabled:opacity-50 transition-colors"
          >
            <CheckCheck size={16} />
            {markAllAsReadMutation.isPending ? 'Marking...' : 'Mark all as read'}
          </button>
        </div>
      </div>

      <NotificationFilters
        typeFilter={typeFilter}
        priorityFilter={priorityFilter}
        readFilter={readFilter}
        onTypeChange={(v) => { setTypeFilter(v); setPage(1) }}
        onPriorityChange={(v) => { setPriorityFilter(v); setPage(1) }}
        onReadChange={(v) => { setReadFilter(v); setPage(1) }}
        typeOptions={TYPE_OPTIONS}
        priorityOptions={PRIORITY_OPTIONS}
        readOptions={READ_OPTIONS}
        onClear={handleClearFilters}
        hasActiveFilters={!!typeFilter || !!priorityFilter || !!readFilter}
      />

      {isFetching && !isLoading && (
        <div className="flex items-center justify-center gap-2 py-2 text-xs text-blue-600 dark:text-blue-400 animate-pulse">
          <RefreshCw size={12} className="animate-spin" />
          Refreshing notifications...
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <NotificationSkeleton />
        ) : error ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-3" />
              <p className="text-red-500 mb-3">{error?.message || 'Failed to load notifications'}</p>
              <button onClick={() => refetch()} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                Retry
              </button>
            </div>
          </div>
        ) : notifications.length === 0 ? (
          <NotificationEmptyState hasActiveFilters={!!typeFilter || !!priorityFilter || !!readFilter} />
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={handleMarkAsRead}
                isMarking={markAsReadMutation.isPending}
              />
            ))}
          </div>
        )}

        {!isLoading && !error && totalPages > 1 && (
          <div className="px-4 py-4 flex items-center justify-between gap-3 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => handlePageChange(page - 1)}
                className="px-3 py-1.5 text-sm rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => handlePageChange(page + 1)}
                className="px-3 py-1.5 text-sm rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function NotificationCenterPage() {
  return (
    <FeatureGate feature="notifications">
      <NotificationsContent />
    </FeatureGate>
  )
}
