import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { useSelector } from 'react-redux'
import { analyticsApi } from '../../lib/analyticsApi'
import { supabase } from '../../lib/supabaseClient'
import { useEffect, useMemo, useState } from 'react'
import { BarChart3, TrendingUp, Clock, Activity } from 'lucide-react'
import DateRangeFilter from '../../components/common/DateRangeFilter'

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

  const [rawData, setRawData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (profile?.company_id && dateRange?.startDate && dateRange?.endDate) {
      analyticsApi.setCompanyId(profile.company_id)
      fetchData(dateRange.startDate, dateRange.endDate)
    }
  }, [profile?.company_id, dateRange?.startDate, dateRange?.endDate])

  // Realtime: auto-refresh when new analytics_data row is inserted
  useEffect(() => {
    if (!profile?.company_id) return

    const channel = supabase
      .channel('analytics_page_realtime')
      .on('postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'analytics_data',
          filter: `company_id=eq.${profile.company_id}`
        },
        () => {
          if (dateRange?.startDate && dateRange?.endDate) {
            fetchData(dateRange.startDate, dateRange.endDate)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [profile?.company_id, dateRange?.startDate, dateRange?.endDate])

  const fetchData = async (startDate, endDate) => {
    try {
      setLoading(true)
      setError(null)
      const data = await analyticsApi.fetchAllData(startDate, endDate)
      setRawData(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('[Analytics] Failed to fetch data:', err)
      setError('Failed to load analytics data')
      setRawData([])
    } finally {
      setLoading(false)
    }
  }

  const eventCounts = useMemo(() => {
    const counts = { activeUsers: 0, projectsCreated: 0, projectsUpdated: 0, projectsDeleted: 0, dashboardViews: 0 }
    rawData.forEach(item => {
      const val = item?.metric_value ?? 1
      switch (item.metric_type) {
        case 'active_users': counts.activeUsers += val; break
        case 'projects_created': counts.projectsCreated += val; break
        case 'projects_updated': counts.projectsUpdated += val; break
        case 'projects_deleted': counts.projectsDeleted += val; break
        case 'dashboard_view': counts.dashboardViews += val; break
      }
    })
    return counts
  }, [rawData])

  const allEvents = useMemo(() => {
    return rawData.map(item => ({
      ...item,
      label: EVENT_LABELS[item.metric_type] || item.metric_type,
      metric_key: item.metric_type
    }))
  }, [rawData])

  const timelineData = useMemo(() => {
    if (!rawData.length) return []

    const eventsByDate = rawData.reduce((acc, item) => {
      const createdAt = item?.created_at || item?.metric_date
      const dt = createdAt ? new Date(createdAt) : null
      if (!dt || Number.isNaN(dt.getTime())) return acc

      const date = dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      if (!acc[date]) {
        acc[date] = { date, events: 0 }
      }

      acc[date].events += (item?.metric_value ?? 1)
      return acc
    }, {})

    return Object.values(eventsByDate)
  }, [rawData])

  const mostActiveEvent = useMemo(() => {
    const entries = [
      { key: 'active_users', title: EVENT_LABELS.active_users, count: eventCounts.activeUsers },
      { key: 'projects_created', title: EVENT_LABELS.projects_created, count: eventCounts.projectsCreated },
      { key: 'projects_updated', title: EVENT_LABELS.projects_updated, count: eventCounts.projectsUpdated },
      { key: 'projects_deleted', title: EVENT_LABELS.projects_deleted, count: eventCounts.projectsDeleted },
      { key: 'dashboard_view', title: EVENT_LABELS.dashboard_view, count: eventCounts.dashboardViews }
    ]

    if (!entries.length) return { title: null, count: 0, subtitle: null }

    const max = entries.reduce((a, b) => (b.count > a.count ? b : a), entries[0])
    if (!max || max.count <= 0) {
      return { title: null, count: 0, subtitle: 'No Activity Yet' }
    }

    return {
      title: max.title,
      count: max.count,
      subtitle: 'events tracked'
    }
  }, [eventCounts])

  const latestActivity = useMemo(() => {
    if (!allEvents.length) return null

    const sorted = [...allEvents].sort((a, b) => {
      const at = a?.created_at || a?.metric_date
      const bt = b?.created_at || b?.metric_date
      const ad = at ? new Date(at).getTime() : 0
      const bd = bt ? new Date(bt).getTime() : 0
      return bd - ad
    })

    const latest = sorted[0]
    if (!latest) return null

    const createdAt = latest?.created_at || latest?.metric_date
    const dt = createdAt ? new Date(createdAt) : null
    if (!dt || Number.isNaN(dt.getTime())) return null

    const label = latest?.label || 'Activity'
    const metricKey = latest.metric_key || 'active_users'
    const now = Date.now()
    const diffMs = Math.max(0, now - dt.getTime())
    const mins = Math.floor(diffMs / 60000)
    const hours = Math.floor(mins / 60)
    const days = Math.floor(hours / 24)

    let timeAgo = 'just now'
    if (days > 0) timeAgo = `${days}d ago`
    else if (hours > 0) timeAgo = `${hours}h ago`
    else if (mins > 0) timeAgo = `${mins} mins ago`
    else timeAgo = 'just now'

    const color = EVENT_COLORS[metricKey]?.bar || 'bg-gray-500'

    return {
      label,
      timeAgo,
      color
    }
  }, [allEvents])

  // Calculate days in selected range for average daily events
  const daysInRange = useMemo(() => {
    if (!dateRange?.startDate || !dateRange?.endDate) return 0
    const start = new Date(dateRange.startDate)
    const end = new Date(dateRange.endDate)
    return Math.max(1, Math.round((end - start) / 86400000) + 1)
  }, [dateRange])

  const totalEventsTracked = useMemo(() => {
    return (
      (eventCounts.activeUsers || 0) +
      (eventCounts.projectsCreated || 0) +
      (eventCounts.projectsUpdated || 0) +
      (eventCounts.projectsDeleted || 0) +
      (eventCounts.dashboardViews || 0)
    )
  }, [eventCounts])

  const averageDailyEvents = useMemo(() => {
    if (daysInRange === 0) return 0
    return Math.round(totalEventsTracked / daysInRange)
  }, [totalEventsTracked, daysInRange])


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading analytics...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-500">{error}</p>
      </div>
    )
  }

  // Render analytics UI even when there's no data (per-card empty states)
  const hasAnyAnalytics = timelineData.length > 0 || allEvents.length > 0


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
                <Line type="monotone" dataKey="events" stroke="#3b82f6" strokeWidth={2} dot={false} name="Events" />
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
