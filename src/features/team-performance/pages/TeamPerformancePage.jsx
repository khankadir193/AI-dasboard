import { useState, useMemo } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Users, Zap, TrendingUp, BarChart2 } from 'lucide-react'
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

// ─── Small stat pill used in the summary strip ────────────────────────────────
function SummaryPill({ icon: Icon, label, value, loading }) {
  return (
    <div className="card flex items-center gap-3 px-4 py-3 min-w-0">
      <span className="p-1.5 rounded-md bg-blue-50 dark:bg-blue-950 flex-none">
        <Icon size={14} className="text-blue-600 dark:text-blue-400" />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium truncate">
          {label}
        </p>
        {loading ? (
          <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-0.5" />
        ) : (
          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
            {value ?? '—'}
          </p>
        )}
      </div>
    </div>
  )
}

/**
 * TeamPerformanceContent — the inner page component.
 *
 * RBAC: checks ANALYTICS_VIEW permission (already granted to all 4 existing roles —
 * no new permission key was added). If insufficient, renders an access-denied message
 * rather than redirecting (consistent with how other analytics pages handle this).
 *
 * Data fetching:
 *   - useTeamPerformance scopes all data to profile.company_id via the service layer.
 *   - useActivityHeatmap receives the SAME dateRange so filter changes refetch both.
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

  // Bug #2 fix: pass dateRange so heatmap respects the selected filter
  const {
    data: heatmapData,
    isLoading: heatmapLoading,
    error: heatmapError,
    refetch: refetchHeatmap,
  } = useActivityHeatmap(dateRange)

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

      {/* ── Summary Strip (new additive row — 4 derived metrics) ────────────── */}
      <TeamEfficiencySummary
        performanceData={performanceData}
        isLoading={isLoading}
      />

      {/* ── Activity Heatmap (respects date filter via dateRange prop) ── */}
      <ActivityHeatmap
        data={heatmapData}
        loading={heatmapLoading}
        error={heatmapError}
        onRetry={refetchHeatmap}
        dateRange={dateRange}
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

// ─── Summary Strip ────────────────────────────────────────────────────────────
// All 4 metrics are pure useMemo derivations from the already-cached
// performanceData — zero additional network calls.
function TeamEfficiencySummary({ performanceData, isLoading }) {
  const topContributors = performanceData?.topContributors ?? []
  const weeklyTrends = performanceData?.weeklyTrends ?? []

  const summary = useMemo(() => {
    // Top Contributor
    const topContributor = topContributors[0]?.name ?? null

    // Average actions per active user
    const totalActions = topContributors.reduce((s, c) => s + c.totalActions, 0)
    const memberCount = topContributors.length
    const avgActionsPerUser =
      memberCount > 0 ? Math.round((totalActions / memberCount) * 10) / 10 : null

    // Weekly Growth % — last 2 completed weeks from weeklyTrends
    let weeklyGrowth = null
    if (weeklyTrends.length >= 2) {
      const lastWeek = weeklyTrends[weeklyTrends.length - 1]?.count ?? 0
      const prevWeek = weeklyTrends[weeklyTrends.length - 2]?.count ?? 0
      if (prevWeek > 0) {
        weeklyGrowth = Math.round(((lastWeek - prevWeek) / prevWeek) * 100)
      } else if (lastWeek > 0) {
        weeklyGrowth = 100 // prev was 0, this week had activity → +100%
      }
    }

    // Active team members (any user with ≥1 action in range)
    const activeMembers = memberCount

    return { topContributor, avgActionsPerUser, weeklyGrowth, activeMembers }
  }, [topContributors, weeklyTrends])

  const growthStr =
    summary.weeklyGrowth === null
      ? '—'
      : `${summary.weeklyGrowth >= 0 ? '+' : ''}${summary.weeklyGrowth}%`

  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
      <SummaryPill
        icon={Users}
        label="Top Contributor"
        value={summary.topContributor}
        loading={isLoading}
      />
      <SummaryPill
        icon={BarChart2}
        label="Avg Actions / User"
        value={summary.avgActionsPerUser !== null ? String(summary.avgActionsPerUser) : '—'}
        loading={isLoading}
      />
      <SummaryPill
        icon={TrendingUp}
        label="Weekly Growth"
        value={growthStr}
        loading={isLoading}
      />
      <SummaryPill
        icon={Zap}
        label="Active Members"
        value={summary.activeMembers > 0 ? String(summary.activeMembers) : '—'}
        loading={isLoading}
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

