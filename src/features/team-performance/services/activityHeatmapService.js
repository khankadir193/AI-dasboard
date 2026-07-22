import { fetchActivityLogs } from '../../../services/activityLogService'

/**
 * Fetches 90 days of activity_logs for the given company and groups by calendar day.
 *
 * Why activity_logs (not analytics_data)?
 *   analytics_data stores pre-aggregated daily metrics keyed by metric_type
 *   (active_users, projects_created, etc.). It cannot give raw per-action-per-day
 *   counts for a contribution heatmap. activity_logs has one row per action, so
 *   grouping by date gives an accurate daily contribution count.
 *
 * Query is bounded at pageSize: 2000. Companies with >2000 actions in 90 days
 * will have their heatmap truncated at the most-recent 2000 events (which still
 * gives a meaningful distribution across the 90-day window).
 *
 * Returns a contiguous 90-element array so the CSS-grid heatmap has no gaps.
 *
 * @param {{ companyId: string }} params
 * @returns {Promise<Array<{ date: string, count: number, dayOfWeek: number }>>}
 */
export async function fetchHeatmapData({ companyId }) {
  if (!companyId) return []

  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - 89) // inclusive: 90 days

  const startDate = start.toISOString().split('T')[0]
  const endDate = end.toISOString().split('T')[0]

  const result = await fetchActivityLogs({
    companyId,
    pageSize: 2000,
    startDate,
    endDate,
  })

  const logs = result?.logs || []

  // Build date → count map
  const countMap = new Map()
  logs.forEach((log) => {
    const date = log.created_at?.split('T')[0]
    if (date) countMap.set(date, (countMap.get(date) || 0) + 1)
  })

  // Fill every day in the window (zero-count days included for grid completeness)
  const days = []
  const cursor = new Date(start)
  cursor.setHours(0, 0, 0, 0)
  const endDay = new Date(end)
  endDay.setHours(23, 59, 59, 999)

  while (cursor <= endDay) {
    const dateStr = cursor.toISOString().split('T')[0]
    days.push({
      date: dateStr,
      count: countMap.get(dateStr) || 0,
      dayOfWeek: cursor.getDay(), // 0 = Sun, 6 = Sat
    })
    cursor.setDate(cursor.getDate() + 1)
  }

  return days
}
