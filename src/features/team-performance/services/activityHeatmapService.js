import { fetchActivityLogs } from '../../../services/activityLogService'

/**
 * Fetches activity_logs for the given company and date range, then groups
 * results by calendar day for a contribution heatmap.
 *
 * Why activity_logs (not analytics_data)?
 *   analytics_data stores pre-aggregated daily metrics keyed by metric_type
 *   (active_users, projects_created, etc.). It cannot give raw per-action-per-day
 *   counts for a contribution heatmap. activity_logs has one row per action, so
 *   grouping by date gives an accurate daily contribution count.
 *
 * Query is bounded at pageSize: 2000. Companies with >2000 actions in the
 * requested window will have their heatmap truncated at the most-recent 2000
 * events (which still gives a meaningful distribution).
 *
 * Returns a contiguous array (one element per day in [startDate, endDate])
 * so the CSS-grid heatmap has no gaps. For a single-day "Today" range this
 * returns a 1-element array — the grid renders a single column correctly.
 *
 * @param {{ companyId: string, startDate: string, endDate: string }} params
 * @returns {Promise<Array<{ date: string, count: number, dayOfWeek: number }>>}
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

  // Build date → count map
  const countMap = new Map()
  logs.forEach((log) => {
    const date = log.created_at?.split('T')[0]
    if (date) countMap.set(date, (countMap.get(date) || 0) + 1)
  })

  // Fill every day in the window (zero-count days included for grid completeness)
  const days = []
  // Parse dates as UTC midnight to avoid DST-induced off-by-one shifts
  const [sy, sm, sd] = startDate.split('-').map(Number)
  const [ey, em, ed] = endDate.split('-').map(Number)
  const cursor = new Date(Date.UTC(sy, sm - 1, sd))
  const endDay = new Date(Date.UTC(ey, em - 1, ed))

  while (cursor <= endDay) {
    const dateStr = cursor.toISOString().split('T')[0]
    days.push({
      date: dateStr,
      count: countMap.get(dateStr) || 0,
      dayOfWeek: cursor.getUTCDay(), // 0 = Sun, 6 = Sat
    })
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }

  return days
}

