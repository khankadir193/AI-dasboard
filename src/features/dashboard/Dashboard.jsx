import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useQueryClient } from '@tanstack/react-query'
import { Loader2, Settings2 } from 'lucide-react'

// Local imports
import { useDashboardAnalytics } from './hooks/useDashboardAnalytics'
import { useTrial } from './hooks/useTrial'
import { useDashboardPreferences } from './hooks/useDashboardPreferences'
import { useAnalyticsSubscription } from '../../hooks/useAnalyticsSubscription'
import KPISection from './components/KPI/KPISection'
import ActivityTimelineChart from './components/Charts/ActivityTimelineChart'
import EventDistributionChart from './components/Charts/EventDistributionChart'
import ProjectStatusChart from './components/Charts/ProjectStatusChart'
import RecentActivityFeed from './components/ActivityFeed/RecentActivityFeed'
import WidgetReorderPanel from './components/WidgetReorderPanel'
import DateRangeFilter from '../../components/common/DateRangeFilter'
import { trackEvent } from '../analytics/trackEvent'
import FeatureGate from '../../components/auth/FeatureGate'

const trackedViewKeys = new Set()
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

  const {
    widgetOrder,
    hiddenWidgets,
    isSaving,
    updatePreferences,
    resetPreferences,
  } = useDashboardPreferences()

  const [showCustomizePanel, setShowCustomizePanel] = useState(false)

  useAnalyticsSubscription(profile?.company_id)

  useEffect(() => {
    if (!isAuthLoading && !user) {
      navigate('/signin', { replace: true })
    }
  }, [isAuthLoading, user, navigate])

  useEffect(() => {
    if (!profile?.company_id) return

    const viewKey = `${profile.company_id}:${locationKey}`
    if (trackedViewKeys.has(viewKey)) return
    trackedViewKeys.add(viewKey)

    const now = Date.now()
    const lastTracked = lastViewTimestamps.get(profile.company_id)
    if (lastTracked && (now - lastTracked) < VIEW_DEDUP_WINDOW_MS) return
    lastViewTimestamps.set(profile.company_id, now)

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

  const showTimeline = !hiddenWidgets.includes('activity_timeline')
  const showProjectStatus = !hiddenWidgets.includes('project_status')

  function renderSlot(slotId) {
    switch (slotId) {
      case 'kpi_section':
        if (hiddenWidgets.includes('kpi_section')) return null
        return (
          <KPISection
            key="kpi_section"
            kpiData={analyticsData?.kpiData}
            growthData={analyticsData?.growthData}
            dateLabel={dateRange.label}
            loading={isLoading}
            error={error}
            onRetry={refetch}
          />
        )

      case 'charts_row':
        if (!showTimeline && !showProjectStatus) return null
        return (
          <div
            key="charts_row"
            className={showTimeline && showProjectStatus
              ? 'grid grid-cols-1 xl:grid-cols-3 gap-6'
              : ''}
          >
            {showTimeline && (
              <ActivityTimelineChart
                data={analyticsData?.activityTimelineData}
                loading={isLoading}
                error={error}
              />
            )}
            {showProjectStatus && (
              <ProjectStatusChart
                data={analyticsData?.projectStatusData}
                loading={isLoading}
                error={error}
              />
            )}
          </div>
        )

      case 'event_distribution':
        if (hiddenWidgets.includes('event_distribution')) return null
        return (
          <EventDistributionChart
            key="event_distribution"
            kpiData={analyticsData?.kpiData}
            loading={isLoading}
            error={error}
          />
        )

      case 'recent_activity_feed':
        if (hiddenWidgets.includes('recent_activity_feed')) return null
        return (
          <RecentActivityFeed
            key="recent_activity_feed"
            activities={analyticsData?.recentActivity}
            loading={isLoading}
            error={error}
          />
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-6 stagger">
      <DateRangeFilter value={dateRange} onChange={setDateRange} />

      <div className="flex items-center justify-between">
        {!isLoading && dataUpdatedAt ? (
          <p className="text-xs text-gray-400">
            Last updated: {new Date(dataUpdatedAt).toLocaleTimeString()}
          </p>
        ) : <span />}
        <button
          id="dashboard-customize-btn"
          onClick={() => setShowCustomizePanel(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          aria-label="Customize dashboard layout"
        >
          <Settings2 size={13} />
          Customize
        </button>
      </div>

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

      {widgetOrder.map((slotId) => renderSlot(slotId))}

      {showCustomizePanel && (
        <WidgetReorderPanel
          widgetOrder={widgetOrder}
          hiddenWidgets={hiddenWidgets}
          isSaving={isSaving}
          onUpdate={(newOrder, newHidden) => {
            updatePreferences(newOrder, newHidden)
            setShowCustomizePanel(false)
          }}
          onReset={() => {
            resetPreferences()
            setShowCustomizePanel(false)
          }}
          onClose={() => setShowCustomizePanel(false)}
        />
      )}
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
