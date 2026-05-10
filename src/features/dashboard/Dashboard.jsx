import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Loader2 } from 'lucide-react'

// Local imports
import { useAnalytics } from './hooks/useAnalytics'
import { useTrial } from './hooks/useTrial'
import KPISection from './components/KPI/KPISection'
import ActivityTimelineChart from './components/Charts/ActivityTimelineChart'
import EventDistributionChart from './components/Charts/EventDistributionChart'
import ProjectStatusChart from './components/Charts/ProjectStatusChart'
import RecentActivityFeed from './components/ActivityFeed/RecentActivityFeed'
import { trackEvent } from '../analytics/trackEvent'

export default function Dashboard() {
  const navigate = useNavigate()
  const { user, loading: isAuthLoading } = useSelector((state) => state.auth)
  const { profile } = useSelector((state) => state.profile)
  const dashboardTrackedRef = useRef(false)

  // Hooks for extracted logic
  const { analyticsData = { isLoading: true, kpiData: {}, activityTimelineData: [], userActivityData: [], projectStatusData: [], recentActivity: [], error: null } } = useAnalytics()
  const { trialInfo = { isLoading: false, trialEnd: null, isExpired: false, daysLeft: 0 } } = useTrial()

  useEffect(() => {
    if (!isAuthLoading && !user) {
      navigate('/signin', { replace: true })
    }
  }, [isAuthLoading, user, navigate])

  // Track dashboard view analytics once when profile is loaded
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

  if (analyticsData.isLoading) {
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
      <KPISection kpiData={analyticsData.kpiData} />

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <ActivityTimelineChart
          data={analyticsData.activityTimelineData}
          loading={analyticsData.isLoading}
          error={analyticsData.error}
        />
        <ProjectStatusChart
          data={analyticsData.projectStatusData}
          loading={analyticsData.isLoading}
          error={analyticsData.error}
        />
      </div>

      {/* Event Distribution Chart */}
      <EventDistributionChart
        kpiData={analyticsData.kpiData}
        loading={analyticsData.isLoading}
        error={analyticsData.error}
      />

      {/* Recent Activity */}
      <RecentActivityFeed
        activities={analyticsData.recentActivity}
        loading={analyticsData.isLoading}
        error={analyticsData.error}
      />
    </div>
  )
}

