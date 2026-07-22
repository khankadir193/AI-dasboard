import { useState } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import FeatureGate from '../../../components/auth/FeatureGate'
import DateRangeFilter from '../../../components/common/DateRangeFilter'
import { useTeamPerformance } from '../hooks/useTeamPerformance'
import { useActivityHeatmap } from '../hooks/useActivityHeatmap'
import { hasPermission, PERMISSIONS } from '../../../utils/permissions'
import TopContributorsTable from '../components/TopContributorsTable'
import ProjectsPerUserChart from '../components/ProjectsPerUserChart'
import CompletionEfficiencyChart from '../components/CompletionEfficiencyChart'
import WeeklyTrendsChart from '../components/WeeklyTrendsChart'
import ActivityHeatmap from '../components/ActivityHeatmap'

/**
 * TeamPerformanceContent — the inner page component.
 *
 * RBAC: checks ANALYTICS_VIEW permission (already granted to all 4 existing roles —
 * no new permission key was added). If insufficient, renders an access-denied message
 * rather than redirecting (consistent with how other analytics pages handle this).
 *
 * Data fetching:
 *   - useTeamPerformance scopes all data to profile.company_id via the service layer.
 *   - useActivityHeatmap is independent (separate cache key, separate staleTime).
 *   - Each section handles its own loading/error/empty state independently.
 */
function TeamPerformanceContent() {
  const navigate = useNavigate()
  const { user, loading: isAuthLoading } = useSelector((state) => state.auth)
  const { profile } = useSelector((state) => state.profile)

  // DateRangeFilter — default last 30 days (mirrors Dashboard.jsx pattern)
  const [dateRange, setDateRange] = useState(() => {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - 30)
    return {
      preset: '30',
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
      label: 'Last 30 Days',
    }
  })

  const {
    data: performanceData,
    isLoading,
    error,
    refetch,
  } = useTeamPerformance(dateRange)

  const {
    data: heatmapData,
    isLoading: heatmapLoading,
    error: heatmapError,
    refetch: refetchHeatmap,
  } = useActivityHeatmap()

  // Auth guard
  if (!isAuthLoading && !user) {
    navigate('/signin', { replace: true })
    return null
  }

  // RBAC guard — reuses existing ANALYTICS_VIEW permission, no new key invented
  if (profile && !hasPermission(profile.role, PERMISSIONS.ANALYTICS_VIEW)) {
    return (
      <div className="card p-8 text-center max-w-md mx-auto">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
          Access Restricted
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          You need the <strong>Analytics View</strong> permission to access Team Performance.
          Contact your administrator to request access.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
          Team Performance
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Analytics derived from real activity logs — no sample data.
        </p>
      </div>

      {/* Date range filter — reuses existing shared component */}
      <DateRangeFilter value={dateRange} onChange={setDateRange} />

      {/* ── Activity Heatmap (90-day, independent of date filter) ── */}
      <ActivityHeatmap
        data={heatmapData}
        loading={heatmapLoading}
        error={heatmapError}
        onRetry={refetchHeatmap}
      />

      {/* ── Top Contributors ── */}
      <TopContributorsTable
        data={performanceData?.topContributors}
        loading={isLoading}
        error={error}
        onRetry={refetch}
      />

      {/* ── Projects Per User + Completion Efficiency (2-col on xl) ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ProjectsPerUserChart
          data={performanceData?.completionEfficiency}
          loading={isLoading}
          error={error}
          onRetry={refetch}
        />
        <CompletionEfficiencyChart
          data={performanceData?.completionEfficiency}
          loading={isLoading}
          error={error}
          onRetry={refetch}
        />
      </div>

      {/* ── Weekly Trends ── */}
      <WeeklyTrendsChart
        data={performanceData?.weeklyTrends}
        loading={isLoading}
        error={error}
        onRetry={refetch}
      />
    </div>
  )
}

/**
 * TeamPerformancePage — public export.
 *
 * Wrapped in FeatureGate with feature="team_performance".
 * "team_performance" is NOT in GATED_FEATURES (same rationale as /analytics —
 * this is a core analytics page, not a premium feature gate).
 */
export default function TeamPerformancePage() {
  return (
    <FeatureGate feature="team_performance">
      <TeamPerformanceContent />
    </FeatureGate>
  )
}
