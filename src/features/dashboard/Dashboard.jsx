import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useQueryClient } from '@tanstack/react-query'
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
import { logActivity, ACTIONS, RESOURCE_TYPES } from '../../services/activityLogService'
import FeatureGate from '../../components/auth/FeatureGate'

// Module-level set persists across StrictMode unmount/remount to prevent duplicate tracking
const trackedViewKeys = new Set()
// Time-based guard: persists across StrictMode cycles to catch duplicate views with different locationKeys
const lastViewTimestamps = new Map()
const VIEW_DEDUP_WINDOW_MS = 5000

function DashboardContent() {
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

  const { data: analyticsData, isLoading, error, refetch, dataUpdatedAt } = useDashboardAnalytics(dateRange)
  const { trialInfo = { isLoading: false, trialEnd: null, isExpired: false, daysLeft: 0 } } = useTrial()
  const queryClient = useQueryClient()
  const { pathname } = useLocation()
  const locationKey = useLocation().key

  useAnalyticsSubscription(profile?.company_id)

  useEffect(() => {
    if (!isAuthLoading && !user) {
      navigate('/signin', { replace: true })
    }
  }, [isAuthLoading, user, navigate])

  // Track dashboard view on every route entry (StrictMode-safe via module-level set keyed by location key)
  useEffect(() => {
    if (!profile?.company_id) return

    const viewKey = `${profile.company_id}:${locationKey}`
    if (trackedViewKeys.has(viewKey)) return
    trackedViewKeys.add(viewKey)

    // Time-based dedup: safety net for different locationKeys in the same redirect burst
    const now = Date.now()
    const lastTracked = lastViewTimestamps.get(profile.company_id)
    if (lastTracked && (now - lastTracked) < VIEW_DEDUP_WINDOW_MS) return
    lastViewTimestamps.set(profile.company_id, now)

    // Cap set size to prevent memory leak in long-lived SPAs
    if (trackedViewKeys.size > 100) {
      trackedViewKeys.clear()
    }

    trackEvent({
      companyId: profile.company_id,
      type: 'dashboard_view',
      value: 1
    }).then(() => {
      queryClient.invalidateQueries({ queryKey: ['dashboardAnalytics', profile.company_id] })
      queryClient.invalidateQueries({ queryKey: ['recentActivity', profile.company_id] })
    })

    logActivity({
      companyId: profile.company_id,
      userId: profile.id,
      action: ACTIONS.DASHBOARD_VIEW,
      resourceType: RESOURCE_TYPES.DASHBOARD,
      description: 'Dashboard viewed'
    })
  }, [profile?.company_id, locationKey])

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

      {!isLoading && dataUpdatedAt && (
        <p className="text-xs text-gray-400 text-right">Last updated: {new Date(dataUpdatedAt).toLocaleTimeString()}</p>
      )}

      {!trialInfo.isLoading && trialInfo.trialEnd && (
        <div
          className={`rounded-xl border px-4 py-3 ${
            trialInfo.isExpired
              ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300'
              : trialInfo.daysLeft <= 3
                ? 'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900 dark:bg-orange-950/40 dark:text-orange-300'
                : 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300'
          }`}
        >
          {trialInfo.isExpired ? (
            <div className="flex items-center justify-between">
              <span>Your trial has expired. Upgrade now.</span>
              <button onClick={() => navigate('/billing')} className="btn-primary text-sm ml-4 flex-none">
                Upgrade
              </button>
            </div>
          ) : (
            `Trial active: ${trialInfo.daysLeft} day${trialInfo.daysLeft === 1 ? '' : 's'} remaining.`
          )}
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

export default function Dashboard() {
  return (
    <FeatureGate feature="dashboard">
      <DashboardContent />
    </FeatureGate>
  )
}

