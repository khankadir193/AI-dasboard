import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Loader2 } from 'lucide-react'

// Local imports
import { useDashboardAnalytics } from './hooks/useDashboardAnalytics'
import { useTrial } from './hooks/useTrial'
import { useAnalyticsSubscription } from '../../hooks/useAnalyticsSubscription'
import KPISection from './components/KPI/KPISection'
import ActivityTimelineChart from './components/Charts/ActivityTimelineChart'
import EventDistributionChart from './components/Charts/EventDistributionChart'
import ProjectStatusChart from './components/Charts/ProjectStatusChart'
import RecentActivityFeed from './components/ActivityFeed/RecentActivityFeed'
import DateRangeFilter from '../../components/common/DateRangeFilter'
import { trackEvent } from '../analytics/trackEvent'

export default function Dashboard() {
  const navigate = useNavigate()
  const { user, loading: isAuthLoading } = useSelector((state) => state.auth)
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

  const { data: analyticsData, isLoading, error, refetch } = useDashboardAnalytics(dateRange)
  const { trialInfo = { isLoading: false, trialEnd: null, isExpired: false, daysLeft: 0 } } = useTrial()
  const { pathname } = useLocation()

  const dashboardTrackedRef = useRef(false)

  useAnalyticsSubscription(profile?.company_id)

  useEffect(() => {
    if (!isAuthLoading && !user) {
      navigate('/signin', { replace: true })
    }
  }, [isAuthLoading, user, navigate])

  // Track dashboard view on every route entry (deduped against StrictMode double-mount)
  useEffect(() => {
    if (!profile?.company_id) return
    if (dashboardTrackedRef.current) return
    dashboardTrackedRef.current = true

    trackEvent({
      companyId: profile.company_id,
      type: 'dashboard_view',
      value: 1
    })
  }, [profile?.company_id])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="animate-spin h-8 w-8 text-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 stagger">
      {/* Date Range Filter */}
      <DateRangeFilter value={dateRange} onChange={setDateRange} />

      {!trialInfo.isLoading && trialInfo.trialEnd && (
        <div
          className={`rounded-xl border px-4 py-3 ${
            trialInfo.isExpired
              ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300'
              : 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300'
          }`}
        >
          {trialInfo.isExpired
            ? 'Your 30-day trial has ended. Upgrade to keep full access.'
            : `Trial active: ${trialInfo.daysLeft} day${trialInfo.daysLeft === 1 ? '' : 's'} remaining.`}
        </div>
      )}

      {/* KPI Section */}
      <KPISection kpiData={analyticsData?.kpiData} growthData={analyticsData?.growthData} dateLabel={dateRange.label} loading={isLoading} error={error} onRetry={refetch} />

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <ActivityTimelineChart
          data={analyticsData?.activityTimelineData}
          loading={isLoading}
          error={error}
        />
        <ProjectStatusChart
          data={analyticsData?.projectStatusData}
          loading={isLoading}
          error={error}
        />
      </div>

      {/* Event Distribution Chart */}
      <EventDistributionChart
        kpiData={analyticsData?.kpiData}
        loading={isLoading}
        error={error}
      />

      {/* Recent Activity */}
      <RecentActivityFeed
        activities={analyticsData?.recentActivity}
        loading={isLoading}
        error={error}
      />
    </div>
  )
}

