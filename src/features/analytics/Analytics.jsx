import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { useSelector } from 'react-redux'
import { useEffect, useState, useMemo } from 'react'
import { BarChart3, TrendingUp, Clock, Activity, Loader2, RefreshCw } from 'lucide-react'
import DateRangeFilter from '../../components/common/DateRangeFilter'
import { useAnalyticsPageData } from './hooks/useAnalyticsPageData'
import { useAnalyticsSubscription } from '../../hooks/useAnalyticsSubscription'

// Reusable event label mapping
const EVENT_LABELS = {
  active_users: 'User Login',
  dashboard_view: 'Dashboard View',
  projects_created: 'Project Created',
  projects_updated: 'Project Updated',
  projects_deleted: 'Project Deleted'
}

const EVENT_COLORS = {
  active_users: { bg: 'bg-blue-50 dark:bg-blue-900/30', bar: 'bg-blue-500', text: 'text-blue-600 dark:text-blue-400' },
  dashboard_view: { bg: 'bg-purple-50 dark:bg-purple-900/30', bar: 'bg-purple-500', text: 'text-purple-600 dark:text-purple-400' },
  projects_created: { bg: 'bg-green-50 dark:bg-green-900/30', bar: 'bg-green-500', text: 'text-green-600 dark:text-green-400' },
  projects_updated: { bg: 'bg-orange-50 dark:bg-orange-900/30', bar: 'bg-orange-500', text: 'text-orange-600 dark:text-orange-400' },
  projects_deleted: { bg: 'bg-red-50 dark:bg-red-900/30', bar: 'bg-red-500', text: 'text-red-600 dark:text-red-400' }
}

export default function Analytics() {
  const { profile } = useSelector((state) => state.profile)

  const [dateRange, setDateRange] = useState(() => {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - 30)
    return {
      preset: '30',
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
      label: 'Last 30 Days'
    }
  })

  const { data, isLoading, error, refetch } = useAnalyticsPageData(dateRange)
  useAnalyticsSubscription(profile?.company_id)

  const eventCounts = data?.eventCounts || { activeUsers: 0, projectsCreated: 0, projectsUpdated: 0, projectsDeleted: 0, dashboardViews: 0 }
  const timelineData = data?.timelineData || []
  const mostActiveEvent = data?.mostActiveEvent || { title: null, count: 0, subtitle: null }
  const rawLatestActivity = data?.latestActivity || null
  const latestActivity = useMemo(() => {
    if (!rawLatestActivity) return null
    const metricKey = rawLatestActivity.metric_key || 'active_users'
    const color = EVENT_COLORS[metricKey]?.bar || 'bg-gray-500'
    return { ...rawLatestActivity, color }
  }, [rawLatestActivity])
  const totalEventsTracked = data?.totalEventsTracked || 0
  const averageDailyEvents = data?.averageDailyEvents || 0

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-500 mb-3">{error?.message || 'Failed to load analytics data'}</p>
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw size={16} />
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 stagger">
      <DateRangeFilter value={dateRange} onChange={setDateRange} />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* User Growth Line Chart */}
        <div className="card p-5">
          <h2 className="font-semibold text-base text-gray-900 dark:text-white mb-0.5">Activity Timeline</h2>
          <p className="text-xs text-gray-500 mb-4">Events tracked over time</p>
          {timelineData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={false} name="Events" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64">
              <p className="text-gray-500">No analytics activity yet</p>
            </div>
          )}
        </div>


        {/* Event Types Breakdown */}
        <div className="card p-5">
          <h2 className="font-semibold text-base text-gray-900 dark:text-white mb-0.5">Event Types</h2>
          <p className="text-xs text-gray-500 mb-4">Distribution of tracked events</p>
          <div className="space-y-3">
            {[
              { key: 'active_users', count: eventCounts.activeUsers },
              { key: 'dashboard_view', count: eventCounts.dashboardViews },
              { key: 'projects_updated', count: eventCounts.projectsUpdated },
              { key: 'projects_created', count: eventCounts.projectsCreated },
              { key: 'projects_deleted', count: eventCounts.projectsDeleted }
            ]
              .filter(item => item.count > 0)
              .sort((a, b) => b.count - a.count)
              .map(({ key, count }) => {
                const colors = EVENT_COLORS[key] || EVENT_COLORS.active_users
                const maxCount = Math.max(
                  eventCounts.activeUsers,
                  eventCounts.dashboardViews,
                  eventCounts.projectsUpdated,
                  eventCounts.projectsCreated,
                  eventCounts.projectsDeleted
                )
                const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{EVENT_LABELS[key]}</span>
                      <span className={`text-xs font-bold ${colors.text}`}>{count}</span>
                    </div>
                    <div className={`h-2 rounded-full ${colors.bg}`}>
                      <div 
                        className={`h-2 rounded-full ${colors.bar} transition-all duration-300`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })
            }
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card text-center py-4 px-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-150">
          <div className="flex items-center justify-center mb-2">
            <BarChart3 size={20} className="text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-xs text-gray-500">Total Events</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{totalEventsTracked}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">All time</p>
        </div>

        <div className="card text-center py-4 px-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-150">
          <div className="flex items-center justify-center mb-2">
            <TrendingUp size={20} className="text-green-600 dark:text-green-400" />
          </div>
          <p className="text-xs text-gray-500">Avg Daily Events</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{averageDailyEvents}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">Per day</p>
        </div>

        <div className="card text-center py-4 px-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-150">
          <div className="flex items-center justify-center mb-2">
            <Activity size={20} className="text-purple-600 dark:text-purple-400" />
          </div>
          <p className="text-xs text-gray-500">Most Active Event</p>
          {mostActiveEvent?.title ? (
            <>
              <p className="text-base font-bold text-gray-900 dark:text-white mt-1 truncate">{mostActiveEvent.title}</p>
              <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{mostActiveEvent.count}</p>
              <p className="text-[10px] text-gray-400">{mostActiveEvent.subtitle}</p>
            </>
          ) : (
            <>
              <p className="text-base font-bold text-gray-900 dark:text-white mt-1">No Activity Yet</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Start using the app</p>
            </>
          )}
        </div>

        <div className="card text-center py-4 px-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-150">
          <div className="flex items-center justify-center mb-2">
            <Clock size={20} className="text-orange-600 dark:text-orange-400" />
          </div>
          <p className="text-xs text-gray-500">Latest Activity</p>
          {latestActivity ? (
            <>
              <div className="flex items-center justify-center gap-2 mt-1">
                <div className={`w-3 h-3 rounded-full ${latestActivity.color}`} />
                <p className="text-base font-bold text-gray-900 dark:text-white truncate">{latestActivity.label}</p>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">{latestActivity.timeAgo}</p>
            </>
          ) : (
            <>
              <p className="text-base font-bold text-gray-900 dark:text-white mt-1">No recent activity</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Events appear here</p>
            </>
          )}
        </div>
      </div>

    </div>
  )
}
