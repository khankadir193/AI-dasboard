import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { useSelector } from 'react-redux'
import { analyticsApi } from '../../lib/analyticsApi'
import { useEffect, useMemo, useState } from 'react'

export default function Analytics() {
  const { profile } = useSelector((state) => state.profile)
  const [activeUsers, setActiveUsers] = useState([])
  const [projectsCreated, setProjectsCreated] = useState([])
  const [projectsUpdated, setProjectsUpdated] = useState([])
  const [projectsDeleted, setProjectsDeleted] = useState([])
  const [dashboardViews, setDashboardViews] = useState([])

  const [eventCounts, setEventCounts] = useState({
    activeUsers: 0,
    projectsCreated: 0,
    projectsUpdated: 0,
    projectsDeleted: 0,
    dashboardViews: 0
  })

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (profile?.company_id) {
      analyticsApi.setCompanyId(profile.company_id)
      fetchRealAnalyticsData()
    }
  }, [profile])

  const fetchRealAnalyticsData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [
        fetchedActiveUsers,
        fetchedProjectsCreated,
        fetchedProjectsUpdated,
        fetchedProjectsDeleted,
        fetchedDashboardViews
      ] = await Promise.all([
        analyticsApi.fetchAnalyticsData('active_users', 30),
        analyticsApi.fetchAnalyticsData('projects_created', 30),
        analyticsApi.fetchAnalyticsData('projects_updated', 30),
        analyticsApi.fetchAnalyticsData('projects_deleted', 30),
        analyticsApi.fetchAnalyticsData('dashboard_view', 30)
      ])

      setActiveUsers(Array.isArray(fetchedActiveUsers) ? fetchedActiveUsers : [])
      setProjectsCreated(Array.isArray(fetchedProjectsCreated) ? fetchedProjectsCreated : [])
      setProjectsUpdated(Array.isArray(fetchedProjectsUpdated) ? fetchedProjectsUpdated : [])
      setProjectsDeleted(Array.isArray(fetchedProjectsDeleted) ? fetchedProjectsDeleted : [])
      setDashboardViews(Array.isArray(fetchedDashboardViews) ? fetchedDashboardViews : [])

      setEventCounts({
        activeUsers: (fetchedActiveUsers || []).reduce((sum, item) => sum + (item?.metric_value || 1), 0),
        projectsCreated: (fetchedProjectsCreated || []).reduce((sum, item) => sum + (item?.metric_value || 1), 0),
        projectsUpdated: (fetchedProjectsUpdated || []).reduce((sum, item) => sum + (item?.metric_value || 1), 0),
        projectsDeleted: (fetchedProjectsDeleted || []).reduce((sum, item) => sum + (item?.metric_value || 1), 0),
        dashboardViews: (fetchedDashboardViews || []).reduce((sum, item) => sum + (item?.metric_value || 1), 0)
      })
    } catch (err) {
      console.error('[Analytics] Failed to fetch real data:', err)
      setError('Failed to load analytics data')

      setActiveUsers([])
      setProjectsCreated([])
      setProjectsUpdated([])
      setProjectsDeleted([])
      setDashboardViews([])
      setEventCounts({
        activeUsers: 0,
        projectsCreated: 0,
        projectsUpdated: 0,
        projectsDeleted: 0,
        dashboardViews: 0
      })
    } finally {
      setLoading(false)
    }
  }

  const allEvents = useMemo(() => {
    const safe = (arr) => (Array.isArray(arr) ? arr : [])
    return [
      ...safe(activeUsers).map((item) => ({ ...item, label: 'Login', metric_key: 'active_users' })),
      ...safe(projectsCreated).map((item) => ({ ...item, label: 'Project Created', metric_key: 'projects_created' })),
      ...safe(projectsUpdated).map((item) => ({ ...item, label: 'Project Updated', metric_key: 'projects_updated' })),
      ...safe(projectsDeleted).map((item) => ({ ...item, label: 'Project Deleted', metric_key: 'projects_deleted' })),
      ...safe(dashboardViews).map((item) => ({ ...item, label: 'Dashboard Viewed', metric_key: 'dashboard_view' }))
    ]
  }, [activeUsers, projectsCreated, projectsUpdated, projectsDeleted, dashboardViews])

  const timelineData = useMemo(() => {
    if (!allEvents.length) return []

    const eventsByDate = allEvents.reduce((acc, item) => {
      const createdAt = item?.created_at || item?.metric_date
      const dt = createdAt ? new Date(createdAt) : null
      if (!dt || Number.isNaN(dt.getTime())) return acc

      const date = dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      if (!acc[date]) {
        acc[date] = { date, events: 0 }
      }

      acc[date].events += (item?.metric_value || 1)
      return acc
    }, {})

    return Object.values(eventsByDate)
  }, [allEvents])

  const mostActiveEvent = useMemo(() => {
    const entries = [
      { key: 'activeUsers', title: 'Login', count: eventCounts.activeUsers },
      { key: 'projectsCreated', title: 'Project Created', count: eventCounts.projectsCreated },
      { key: 'projectsUpdated', title: 'Project Updated', count: eventCounts.projectsUpdated },
      { key: 'projectsDeleted', title: 'Project Deleted', count: eventCounts.projectsDeleted },
      { key: 'dashboardViews', title: 'Dashboard Views', count: eventCounts.dashboardViews }
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

    const icon = latest.metric_key === 'active_users'
      ? '🟣'
      : latest.metric_key === 'projects_created'
        ? '🟢'
        : latest.metric_key === 'projects_updated'
          ? '🟡'
          : latest.metric_key === 'projects_deleted'
            ? '🔴'
            : '🟣'

    return {
      text: `${icon} ${label}`,
      timeAgo
    }
  }, [allEvents])

  const totalEventsTracked = useMemo(() => {
    return (
      (eventCounts.activeUsers || 0) +
      (eventCounts.projectsCreated || 0) +
      (eventCounts.projectsUpdated || 0) +
      (eventCounts.projectsDeleted || 0) +
      (eventCounts.dashboardViews || 0)
    )
  }, [eventCounts])


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
          <div className="space-y-2">
            <div className="flex items-center justify-between px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-md">
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Login (active_users)</span>
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{eventCounts.activeUsers}</span>
            </div>
            <div className="flex items-center justify-between px-3 py-2 bg-green-50 dark:bg-green-900/20 rounded-md">
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Projects Created</span>
              <span className="text-xs font-bold text-green-600 dark:text-green-400">{eventCounts.projectsCreated}</span>
            </div>
            <div className="flex items-center justify-between px-3 py-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Projects Updated</span>
              <span className="text-xs font-bold text-yellow-600 dark:text-yellow-400">{eventCounts.projectsUpdated}</span>
            </div>
            <div className="flex items-center justify-between px-3 py-2 bg-red-50 dark:bg-red-900/20 rounded-md">
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Projects Deleted</span>
              <span className="text-xs font-bold text-red-600 dark:text-red-400">{eventCounts.projectsDeleted}</span>
            </div>
            <div className="flex items-center justify-between px-3 py-2 bg-purple-50 dark:bg-purple-900/20 rounded-md">
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Dashboard Views</span>
              <span className="text-xs font-bold text-purple-600 dark:text-purple-400">{eventCounts.dashboardViews}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card text-center py-4 px-4">
          <p className="text-xs text-gray-500">Total Events Tracked</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{totalEventsTracked}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">Real user activity</p>
        </div>

        {/* Most Active Event (replaces static Data Source card) */}
        <div className="card text-center py-4 px-4">
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
              <p className="text-[10px] text-gray-400 mt-0.5">Start using the app to generate events</p>
            </>
          )}
        </div>

        {/* Latest Activity (small operational insight) */}
        <div className="card text-center py-4 px-4">
          <p className="text-xs text-gray-500">Latest Activity</p>
          {latestActivity ? (
            <>
              <p className="text-base font-bold text-gray-900 dark:text-white mt-1 truncate">{latestActivity.text}</p>
              <p className="text-xs text-gray-400 mt-0.5">{latestActivity.timeAgo}</p>
            </>
          ) : (
            <>
              <p className="text-base font-bold text-gray-900 dark:text-white mt-1">No recent activity</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Events will appear here automatically</p>
            </>
          )}
        </div>
      </div>

    </div>
  )
}
