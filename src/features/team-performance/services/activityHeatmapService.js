import { fetchActivityLogs } from '../../../services/activityLogService'
import { buildHeatmapDays } from './teamPerformanceService'

/**
 * Standalone heatmap data fetcher — used when heatmap data is needed
 * independently of the full team performance query (e.g. on a future page
 * that shows only the heatmap widget without the full analytics suite).
 *
 * In the current TeamPerformancePage, this function is NOT called directly.
 * Instead, `fetchTeamPerformanceData` derives heatmapDays from its already-fetched
 * logs batch and returns it alongside topContributors, weeklyTrends, etc.
 * This eliminates the duplicate Supabase round-trip that previously occurred
 * when useActivityHeatmap made its own independent fetchActivityLogs call for
 * the same company/date range.
 *
 * Kept here for backwards compatibility and standalone reuse.
 *
 * @param {{ companyId: string, startDate: string, endDate: string }} params
 * @returns {Promise<Array<{ date, count, dayOfWeek, contributors, topAction }>>}
 */
export async function fetchHeatmapData({ companyId, startDate, endDate }) {
  if (!companyId || !startDate || !endDate) return []

  const result = await fetchActivityLogs({
    companyId,
    pageSize: 2000,
    startDate,
    endDate,
  })

  const logs = result?.logs || []
  return buildHeatmapDays(logs, startDate, endDate)
}
