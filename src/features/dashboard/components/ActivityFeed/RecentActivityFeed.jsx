import { Loader2 } from 'lucide-react'
import { memo } from 'react'

const getEventIcon = (metricType) => {
  switch (metricType) {
    case 'projects_created':
      return '🟢'
    case 'projects_updated':
      return '🟡'
    case 'projects_deleted':
      return '🔴'
    case 'active_users':
      return '🔵'
    case 'dashboard_view':
      return '🟣'
    default:
      return '⚪'
  }
}

const getEventLabel = (metricType) => {
  switch (metricType) {
    case 'projects_created':
      return 'Project Created'
    case 'projects_updated':
      return 'Project Updated'
    case 'projects_deleted':
      return 'Project Deleted'
    case 'active_users':
      return 'User Login'
    case 'dashboard_view':
      return 'Dashboard Viewed'
    default:
      return 'Unknown Event'
  }
}

const getTimeAgo = (dateString) => {
  if (!dateString) return 'Unknown time'

  const date = new Date(dateString)
  if (isNaN(date.getTime())) return 'Unknown time'

  const now = new Date()
  const seconds = Math.floor((now - date) / 1000)

  if (seconds < 0) return 'Just now'
  if (seconds < 60) return `${seconds} sec${seconds !== 1 ? 's' : ''} ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} min${minutes !== 1 ? 's' : ''} ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days !== 1 ? 's' : ''} ago`
}

const RecentActivityFeed = memo(({ activities = [], loading = false, error = null }) => {
  const safeActivities = Array.isArray(activities) ? activities : []
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-semibold text-gray-900 dark:text-white">Recent Activity</h2>
          <p className="text-sm text-gray-500">
            {loading ? 'Loading...' : `${safeActivities.length || 0} recent events`}
          </p>
        </div>
        <span className="text-xs bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 font-medium px-2.5 py-1 rounded-full">
          Live Data
        </span>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="flex items-center justify-center h-48 text-red-600">
          <p>Error loading activity data</p>
        </div>
      ) : safeActivities.length === 0 ? (
        <div className="flex items-center justify-center h-48 text-gray-500">
          <p className="text-center">No analytics activity yet.<br />Create projects or use the dashboard to start tracking events.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {safeActivities.slice(0, 10).map((activity, index) => (
            <div
              key={`${activity.id}-${index}`}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <span className="text-xl flex-shrink-0">{getEventIcon(activity.metric_type)}</span>
              <span className="text-sm flex-1 text-gray-700 dark:text-gray-300">
                {getEventLabel(activity.metric_type)}
              </span>
              <span className="text-xs text-gray-400">{getTimeAgo(activity.created_at)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
})

export default RecentActivityFeed
