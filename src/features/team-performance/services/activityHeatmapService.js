import { fetchActivityLogs } from '../../../services/activityLogService'
import { buildHeatmapDays } from './teamPerformanceService'

/** Standalone heatmap data fetcher. */
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
