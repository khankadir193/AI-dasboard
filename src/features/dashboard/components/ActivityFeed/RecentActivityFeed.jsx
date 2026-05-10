import { Loader2, LogIn, LayoutDashboard, PlusCircle, RefreshCw, Trash2, Activity } from 'lucide-react'
import { memo } from 'react'

const getEventIcon = (metricType) => {
  switch (metricType) {
    case 'projects_created':
      return { icon: PlusCircle, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30' }
    case 'projects_updated':
      return { icon: RefreshCw, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-900/30' }
    case 'projects_deleted':
      return { icon: Trash2, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30' }
    case 'active_users':
      return { icon: LogIn, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30' }
    case 'dashboard_view':
      return { icon: LayoutDashboard, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-900/30' }
    default:
      return { icon: Activity, color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-100 dark:bg-gray-800' }
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
        <div className="flex flex-col items-center justify-center h-48 text-gray-500">
          <Activity size={32} className="mb-2 text-gray-400" />
          <p className="text-center text-sm">No recent activity yet</p>
        </div>
      ) : (
        <div className="max-h-[420px] overflow-y-auto space-y-1">
          {safeActivities.slice(0, 10).map((activity, index) => {
            const { icon: Icon, color, bg } = getEventIcon(activity.metric_type)
            return (
              <div
                key={`${activity.id}-${index}`}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-150"
              >
                <div className={`w-9 h-9 rounded-full ${bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon size={16} className={color} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {getEventLabel(activity.metric_type)}
                  </p>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                  {getTimeAgo(activity.created_at)}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
})

export default RecentActivityFeed
