import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { formatCurrency } from '../../utils/mockData'
import { useSelector } from 'react-redux'
import { analyticsApi } from '../../lib/analyticsApi'
import { useEffect, useState } from 'react'

export default function Analytics() {
  const { profile } = useSelector((state) => state.profile)
  const [userData, setUserData] = useState([])
  const [revenueData, setRevenueData] = useState([])
  const [eventCounts, setEventCounts] = useState({
    activeUsers: 0,
    projectsCreated: 0,
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

      // Fetch real data from Supabase - query actual tracked event types
      const [activeUsers, projectsCreated, projectsDeleted, dashboardViews] = await Promise.all([
        analyticsApi.fetchAnalyticsData('active_users', 30),
        analyticsApi.fetchAnalyticsData('projects_created', 30),
        analyticsApi.fetchAnalyticsData('projects_deleted', 30),
        analyticsApi.fetchAnalyticsData('dashboard_view', 30)
      ])

      // Set event counts for display
      setEventCounts({
        activeUsers: activeUsers.length,
        projectsCreated: projectsCreated.length,
        projectsDeleted: projectsDeleted.length,
        dashboardViews: dashboardViews.length
      })

      // Transform data for charts
      const allEvents = [
        ...activeUsers.map(item => ({ ...item, label: 'Login' })),
        ...projectsCreated.map(item => ({ ...item, label: 'Project Created' })),
        ...projectsDeleted.map(item => ({ ...item, label: 'Project Deleted' })),
        ...dashboardViews.map(item => ({ ...item, label: 'Dashboard View' }))
      ]

      // Group by date for chart
      const eventsByDate = allEvents.reduce((acc, item) => {
        const date = new Date(item.metric_date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        })
        if (!acc[date]) {
          acc[date] = { date, count: 0, events: [] }
        }
        acc[date].count += 1
        acc[date].events.push(item.label)
        return acc
      }, {})

      setUserData(Object.values(eventsByDate))
      setRevenueData([]) // No revenue data in current tracking
    } catch (err) {
      console.error('[Analytics] Failed to fetch real data:', err)
      setError('Failed to load analytics data')
    } finally {
      setLoading(false)
    }
  }

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

  if (userData.length === 0 && revenueData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">No analytics data yet. Start using the app to see analytics.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 stagger">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* User Growth Line Chart */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-1">Activity Timeline</h2>
          <p className="text-sm text-gray-500 mb-6">Events tracked over time</p>
          {userData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={userData}>
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
              <p className="text-gray-500">No activity data available</p>
            </div>
          )}
        </div>

        {/* Event Types Breakdown */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-1">Event Types</h2>
          <p className="text-sm text-gray-500 mb-6">Distribution of tracked events</p>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Login (active_users)</span>
              <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{eventCounts.activeUsers}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Projects Created</span>
              <span className="text-sm font-bold text-green-600 dark:text-green-400">{eventCounts.projectsCreated}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Projects Deleted</span>
              <span className="text-sm font-bold text-red-600 dark:text-red-400">{eventCounts.projectsDeleted}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Dashboard Views</span>
              <span className="text-sm font-bold text-purple-600 dark:text-purple-400">{eventCounts.dashboardViews}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stats - Will be calculated from real data */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card text-center">
          <p className="text-sm text-gray-500">Total Events Tracked</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{userData.length + revenueData.length}</p>
          <p className="text-xs text-gray-400 mt-1">Real user activity</p>
        </div>
        <div className="card text-center">
          <p className="text-sm text-gray-500">Data Source</p>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">Real</p>
          <p className="text-xs text-gray-400 mt-1">No mock data</p>
        </div>
        <div className="card text-center">
          <p className="text-sm text-gray-500">Status</p>
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">Active</p>
          <p className="text-xs text-gray-400 mt-1">Event-based tracking</p>
        </div>
      </div>
    </div>
  )
}
