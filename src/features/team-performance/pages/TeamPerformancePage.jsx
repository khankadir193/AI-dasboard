import { useState } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  Users, Zap, TrendingUp, BarChart2, Award, Calendar,
  Flame, Star, Activity, BarChart
} from 'lucide-react'
import FeatureGate from '../../../components/auth/FeatureGate'
import DateRangeFilter from '../../../components/common/DateRangeFilter'
import { useTeamPerformance } from '../hooks/useTeamPerformance'
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
 *   - The result now includes `heatmapDays` derived from the same logs batch —
 *     no second Supabase request for ActivityHeatmap.
 *   - Changing the DateRangeFilter updates ALL widgets simultaneously via one
 *     shared dateRange state. No widget has an independent filter.
 */
function TeamPerformanceContent() {
  const navigate = useNavigate()
  const { user, loading: isAuthLoading } = useSelector((state) => state.auth)
  const { profile } = useSelector((state) => state.profile)

  // Single shared filter state — all widgets update together when this changes.
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

  // Single query — returns all analytics data including heatmapDays.
  // No separate useActivityHeatmap call needed.
  const {
    data: performanceData,
    isLoading,
    error,
    refetch,
  } = useTeamPerformance(dateRange)

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

      {/* Date range filter — single shared state; all widgets update together */}
      <DateRangeFilter value={dateRange} onChange={setDateRange} />

      {/* ── Analytics Cards — 10 metrics, all derived from activity_logs ── */}
      <TeamEfficiencySummary
        performanceData={performanceData}
        isLoading={isLoading}
      />

      {/* ── Activity Heatmap — heatmapDays from same query (no second fetch) ── */}
      <ActivityHeatmap
        data={performanceData?.heatmapDays}
        loading={isLoading}
        error={error}
        onRetry={refetch}
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

      {/* ── Activity Trends — adapts grouping to selected date range ── */}
      <WeeklyTrendsChart
        data={performanceData?.weeklyTrends}
        loading={isLoading}
        error={error}
        onRetry={refetch}
        dateRange={dateRange}
      />
    </div>
  )
}

// ─── Analytics Summary Strip ──────────────────────────────────────────────────
// 10 metrics (2 rows of 5), all derived from activity_logs via computeAnalyticsCards.
// Zero additional network calls beyond the main data fetch.
//
// Row 1: Top Contributor · Avg Actions/User · Weekly Growth · Active Members · Total Actions
// Row 2: Avg Daily Actions · Team Efficiency · Most Active Day · Most Active Week · Peak Date
function TeamEfficiencySummary({ performanceData, isLoading }) {
  const cards = performanceData?.analyticsCards ?? null

  const growthStr =
    cards?.weeklyGrowth === null || cards?.weeklyGrowth === undefined
      ? '—'
      : `${cards.weeklyGrowth >= 0 ? '+' : ''}${cards.weeklyGrowth}%`

  const efficiencyStr =
    cards?.teamEfficiency !== null && cards?.teamEfficiency !== undefined
      ? `${cards.teamEfficiency} / day`
      : '—'

  const avgDailyStr =
    cards?.avgDailyActions !== null && cards?.avgDailyActions !== undefined
      ? String(cards.avgDailyActions)
      : '—'

  const totalActionsStr =
    cards?.totalActions !== null && cards?.totalActions !== undefined
      ? cards.totalActions.toLocaleString()
      : '—'

  return (
    <div className="grid grid-cols-2 xl:grid-cols-5 gap-3">
      {/* Row 1 */}
      <SummaryPill
        icon={Users}
        label="Top Contributor"
        value={cards?.topContributor}
        loading={isLoading}
      />
      <SummaryPill
        icon={BarChart2}
        label="Avg Actions / User"
        value={
          cards?.avgActionsPerUser !== null && cards?.avgActionsPerUser !== undefined
            ? String(cards.avgActionsPerUser)
            : '—'
        }
        loading={isLoading}
      />
      <SummaryPill
        icon={TrendingUp}
        label="Growth"
        value={growthStr}
        loading={isLoading}
      />
      <SummaryPill
        icon={Zap}
        label="Active Members"
        value={cards?.activeMembers > 0 ? String(cards.activeMembers) : '—'}
        loading={isLoading}
      />
      <SummaryPill
        icon={Activity}
        label="Total Actions"
        value={totalActionsStr}
        loading={isLoading}
      />

      {/* Row 2 */}
      <SummaryPill
        icon={BarChart}
        label="Avg Daily Actions"
        value={avgDailyStr}
        loading={isLoading}
      />
      <SummaryPill
        icon={Award}
        label="Team Efficiency"
        value={efficiencyStr}
        loading={isLoading}
      />
      <SummaryPill
        icon={Calendar}
        label="Most Active Day"
        value={cards?.mostActiveDay}
        loading={isLoading}
      />
      <SummaryPill
        icon={Flame}
        label="Most Active Period"
        value={cards?.mostActiveWeek}
        loading={isLoading}
      />
      <SummaryPill
        icon={Star}
        label="Peak Activity Date"
        value={cards?.peakActivityDate}
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
