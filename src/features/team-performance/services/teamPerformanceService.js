import { supabase } from '../../../lib/supabaseClient'
import { fetchActivityLogs } from '../../../services/activityLogService'
import { analyticsService } from '../../../services/analyticsService'

/**
 * Aggregates activity logs by user_id into per-user action metrics.
 *
 * Extracted from features/reports/api/generators/teamProductivityReportGenerator.js
 * (private function `computeTeamActivity`) so it can be shared between:
 *   - Team Performance Analytics page  (this feature)
 *   - Reports → Team Productivity generator (re-imports from here)
 *
 * Zero logic change from the original — same Map iteration, same profile lookup.
 * Login tracking intentionally excluded: login/logout are not business actions
 * and should not skew contributor rankings or action counts.
 *
 * Added: contributionPct — each user's share of total team actions (0–100).
 * Used by TopContributorsTable to show a Contribution % column.
 *
 * @param {Array} logs - activity_logs rows (array of log objects)
 * @returns {Promise<Array>} sorted array of contributor objects
 */
export async function computeTeamActivity(logs) {
  if (!logs || logs.length === 0) return []

  const userMap = new Map()

  logs.forEach((log) => {
    const uid = log.user_id
    if (!uid) return

    if (!userMap.has(uid)) {
      userMap.set(uid, {
        userId: uid,
        totalActions: 0,
        projectsCreated: 0,
        projectsUpdated: 0,
        activeDays: new Set(), // unique calendar days this user had activity
      })
    }

    const entry = userMap.get(uid)
    entry.totalActions++

    // Track unique active days for actionsPerDay derivation
    const dateStr = log.created_at?.split('T')[0]
    if (dateStr) entry.activeDays.add(dateStr)

    if (
      log.action === 'project_create' ||
      log.action === 'projects_created' ||
      log.action === 'project_created'
    ) {
      entry.projectsCreated++
    }

    if (
      log.action === 'project_update' ||
      log.action === 'project_updated' ||
      log.action === 'projects_updated'
    ) {
      entry.projectsUpdated++
    }
  })

  const userIds = Array.from(userMap.keys())
  let profiles = []
  try {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', userIds)
    profiles = data || []
  } catch {
    // Profile lookup failure is non-fatal — contributor names fall back to 'Team Member'
  }

  const profileMap = {}
  profiles.forEach((p) => {
    profileMap[p.id] = p.full_name || p.email || 'Unknown'
  })

  // Total actions across all users — needed for contribution %
  const teamTotal = Array.from(userMap.values()).reduce((s, e) => s + e.totalActions, 0)

  const sorted = Array.from(userMap.values())
    .sort((a, b) => b.totalActions - a.totalActions)

  // Assign ranks with proper tie handling:
  // Two users with the same totalActions get the same rank number.
  // The next distinct rank skips the appropriate number (dense rank not used — matches Jira/Linear convention).
  let rank = 1
  return sorted.map((entry, index) => {
    if (index > 0 && sorted[index].totalActions < sorted[index - 1].totalActions) {
      rank = index + 1
    }
    const contributionPct =
      teamTotal > 0 ? Math.round((entry.totalActions / teamTotal) * 100 * 10) / 10 : 0

    return {
      rank,
      userId: entry.userId,
      name: profileMap[entry.userId] || 'Team Member',
      totalActions: entry.totalActions,
      projectsCreated: entry.projectsCreated,
      projectsUpdated: entry.projectsUpdated,
      activeDays: entry.activeDays.size,
      contributionPct,
      contributions: entry.totalActions, // alias kept for report compatibility
    }
  })
}

/**
 * Groups activity logs into time buckets appropriate for the selected date range.
 *
 * Grouping strategy (aligned with UI heatmap modes):
 *   ≤ 1 day  → hourly  (24 buckets)
 *   ≤ 7 days → daily   (1 bucket per calendar day)
 *   > 7 days → weekly  (ISO Monday-anchored weeks, last N weeks within range)
 *
 * The result is always anchored to the actual startDate/endDate, not "last N
 * weeks from today". This fixes the previous bug where changing the date filter
 * had no effect on the weekly trends chart.
 *
 * @param {Array}  logs      - activity_logs rows
 * @param {string} startDate - YYYY-MM-DD
 * @param {string} endDate   - YYYY-MM-DD
 * @returns {Array<{ week: string, label: string, count: number }>}
 */
function buildWeeklyTrends(logs, startDate, endDate) {
  const start = new Date(startDate + 'T00:00:00Z')
  const end = new Date(endDate + 'T23:59:59Z')
  const diffDays = Math.round((end - start) / (1000 * 60 * 60 * 24))

  if (diffDays <= 1) {
    // ── Hourly buckets (Today / 1-day range) ──────────────────────────────────
    const hourMap = new Array(24).fill(0)
    logs.forEach((log) => {
      const d = new Date(log.created_at)
      if (!isNaN(d.getTime())) hourMap[d.getUTCHours()]++
    })
    return hourMap.map((count, h) => ({
      week: `${h.toString().padStart(2, '0')}:00`,
      label: `${h.toString().padStart(2, '0')}:00`,
      count,
    }))
  }

  if (diffDays <= 7) {
    // ── Daily buckets (≤ 7-day range) ────────────────────────────────────────
    const dateMap = new Map()
    logs.forEach((log) => {
      const date = log.created_at?.split('T')[0]
      if (date) dateMap.set(date, (dateMap.get(date) || 0) + 1)
    })

    const result = []
    const cursor = new Date(start)
    while (cursor <= end) {
      const dateStr = cursor.toISOString().split('T')[0]
      result.push({
        week: dateStr,
        label: cursor.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }),
        count: dateMap.get(dateStr) || 0,
      })
      cursor.setUTCDate(cursor.getUTCDate() + 1)
    }
    return result
  }

  // ── Weekly buckets (> 7-day range) ───────────────────────────────────────
  // Snap each log to its ISO Monday, then aggregate into weekly counts.
  const weekMap = new Map()
  logs.forEach((log) => {
    const d = new Date(log.created_at)
    if (isNaN(d.getTime())) return

    const dow = d.getUTCDay() // 0 = Sun
    const diffToMon = dow === 0 ? -6 : 1 - dow
    const monday = new Date(d)
    monday.setUTCDate(d.getUTCDate() + diffToMon)
    monday.setUTCHours(0, 0, 0, 0)

    const weekKey = monday.toISOString().split('T')[0]
    weekMap.set(weekKey, (weekMap.get(weekKey) || 0) + 1)
  })

  // Generate week slots from startDate through endDate (Monday-anchored)
  const firstMonday = new Date(start)
  const startDow = firstMonday.getUTCDay()
  const backToMon = startDow === 0 ? -6 : 1 - startDow
  firstMonday.setUTCDate(firstMonday.getUTCDate() + backToMon)
  firstMonday.setUTCHours(0, 0, 0, 0)

  const result = []
  const cursor = new Date(firstMonday)
  while (cursor <= end) {
    const weekKey = cursor.toISOString().split('T')[0]
    result.push({
      week: weekKey,
      label: cursor.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }),
      count: weekMap.get(weekKey) || 0,
    })
    cursor.setUTCDate(cursor.getUTCDate() + 7)
  }
  return result
}

// Day-of-week label map (0 = Sun)
const DOW_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

/**
 * Derives all analytics card values from a single pass over the activity_logs array.
 * Zero additional network requests — operates on the batch already fetched for the page.
 *
 * Derived metrics:
 *   - topContributor       — user with most actions
 *   - avgActionsPerUser    — total actions / distinct user count
 *   - weeklyGrowth         — % change between last two trend buckets
 *   - activeMembers        — count of users with ≥1 action
 *   - totalActions         — sum of all business actions in the period
 *   - avgDailyActions      — totalActions / number of distinct active days
 *   - teamEfficiency       — avg actions per active day across all active users
 *   - mostActiveDay        — day-of-week (Mon–Sun) with highest average daily actions
 *   - mostActiveWeek       — trend-bucket label with highest action count
 *   - peakActivityDate     — single calendar date with most actions
 *
 * @param {Array} topContributors - output of computeTeamActivity
 * @param {Array} weeklyTrends    - output of buildWeeklyTrends
 * @param {Array} logs            - raw activity_logs rows
 */
function computeAnalyticsCards(topContributors, weeklyTrends, logs) {
  // ── Top Contributor ────────────────────────────────────────────────────────
  const topContributor = topContributors[0]?.name ?? null

  // ── Avg Actions / User ─────────────────────────────────────────────────────
  const totalActions = topContributors.reduce((s, c) => s + c.totalActions, 0)
  const memberCount = topContributors.length
  const avgActionsPerUser =
    memberCount > 0 ? Math.round((totalActions / memberCount) * 10) / 10 : null

  // ── Weekly Growth % ────────────────────────────────────────────────────────
  let weeklyGrowth = null
  if (weeklyTrends.length >= 2) {
    const lastBucket = weeklyTrends[weeklyTrends.length - 1]?.count ?? 0
    const prevBucket = weeklyTrends[weeklyTrends.length - 2]?.count ?? 0
    if (prevBucket > 0) {
      weeklyGrowth = Math.round(((lastBucket - prevBucket) / prevBucket) * 100)
    } else if (lastBucket > 0) {
      weeklyGrowth = 100 // prev was 0, this period had activity → +100%
    }
  }

  // ── Active Members ─────────────────────────────────────────────────────────
  const activeMembers = memberCount

  // ── Total Actions ─────────────────────────────────────────────────────────
  // Exposed so the KPI strip can show "Total Actions" as its own card.

  // ── Avg Daily Actions ─────────────────────────────────────────────────────
  const activeDates = new Set()
  logs.forEach((log) => {
    const date = log.created_at?.split('T')[0]
    if (date) activeDates.add(date)
  })
  const avgDailyActions =
    activeDates.size > 0 ? Math.round((totalActions / activeDates.size) * 10) / 10 : null

  // ── Team Efficiency ────────────────────────────────────────────────────────
  // Ratio: total actions / total active days across all users.
  const totalActiveDays = topContributors.reduce((s, c) => s + c.activeDays, 0)
  const teamEfficiency =
    totalActiveDays > 0 ? Math.round((totalActions / totalActiveDays) * 10) / 10 : null

  // ── Most Active Day (day-of-week) ──────────────────────────────────────────
  const dowCounts = new Array(7).fill(0)
  logs.forEach((log) => {
    const d = new Date(log.created_at)
    if (!isNaN(d.getTime())) dowCounts[d.getDay()]++
  })
  let mostActiveDow = null
  let mostActiveDowCount = 0
  dowCounts.forEach((count, dow) => {
    if (count > mostActiveDowCount) {
      mostActiveDowCount = count
      mostActiveDow = dow
    }
  })
  const mostActiveDay =
    mostActiveDow !== null && mostActiveDowCount > 0 ? DOW_LABELS[mostActiveDow] : null

  // ── Most Active Week ───────────────────────────────────────────────────────
  let mostActiveWeek = null
  let mostActiveWeekCount = 0
  weeklyTrends.forEach((w) => {
    if (w.count > mostActiveWeekCount) {
      mostActiveWeekCount = w.count
      mostActiveWeek = w.label
    }
  })

  // ── Peak Activity Date ─────────────────────────────────────────────────────
  const dateCounts = new Map()
  logs.forEach((log) => {
    const date = log.created_at?.split('T')[0]
    if (date) dateCounts.set(date, (dateCounts.get(date) || 0) + 1)
  })
  let peakActivityDate = null
  let peakCount = 0
  dateCounts.forEach((count, date) => {
    if (count > peakCount) {
      peakCount = count
      peakActivityDate = date
    }
  })
  if (peakActivityDate) {
    const [y, m, d] = peakActivityDate.split('-').map(Number)
    peakActivityDate = new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return {
    topContributor,
    avgActionsPerUser,
    weeklyGrowth,
    activeMembers,
    totalActions,
    avgDailyActions,
    teamEfficiency,
    mostActiveDay,
    mostActiveWeek,
    peakActivityDate,
  }
}

/**
 * Groups pre-fetched activity_logs into per-day heatmap cells for the selected range.
 *
 * Called internally by fetchTeamPerformanceData to derive heatmap data from the
 * SAME logs batch — avoiding a second Supabase round-trip. The result is returned
 * alongside topContributors and weeklyTrends in the single combined query.
 *
 * Cell shape: { date, count, dayOfWeek, contributors, topAction }
 *   - contributors: number of distinct users active on that day
 *   - topAction:    the most-common action type on that day (for tooltip)
 *
 * @param {Array}  logs      - activity_logs rows already fetched
 * @param {string} startDate - YYYY-MM-DD
 * @param {string} endDate   - YYYY-MM-DD
 * @returns {Array<{ date, count, dayOfWeek, contributors, topAction }>}
 */
export function buildHeatmapDays(logs, startDate, endDate) {
  if (!startDate || !endDate) return []

  // Build per-day aggregation
  const dayMap = new Map() // date → { count, users: Set, actions: Map<action,count> }

  logs.forEach((log) => {
    const date = log.created_at?.split('T')[0]
    if (!date) return

    if (!dayMap.has(date)) {
      dayMap.set(date, { count: 0, users: new Set(), actions: new Map() })
    }
    const entry = dayMap.get(date)
    entry.count++
    if (log.user_id) entry.users.add(log.user_id)
    if (log.action) {
      entry.actions.set(log.action, (entry.actions.get(log.action) || 0) + 1)
    }
  })

  // Resolve topAction per day (action with highest count)
  const getTopAction = (actionMap) => {
    let top = null
    let topCount = 0
    actionMap.forEach((count, action) => {
      if (count > topCount) {
        topCount = count
        top = action
      }
    })
    // Format for display: 'project_create' → 'Project Create'
    return top
      ? top.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
      : null
  }

  // Fill contiguous day range (zero-count days included for grid completeness)
  const days = []
  const [sy, sm, sd] = startDate.split('-').map(Number)
  const [ey, em, ed] = endDate.split('-').map(Number)
  const cursor = new Date(Date.UTC(sy, sm - 1, sd))
  const endDay = new Date(Date.UTC(ey, em - 1, ed))

  while (cursor <= endDay) {
    const dateStr = cursor.toISOString().split('T')[0]
    const entry = dayMap.get(dateStr)
    days.push({
      date: dateStr,
      count: entry?.count || 0,
      dayOfWeek: cursor.getUTCDay(), // 0 = Sun, 6 = Sat
      contributors: entry?.users.size || 0,
      topAction: entry ? getTopAction(entry.actions) : null,
    })
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }

  return days
}

/**
 * Fetches all data needed for the Team Performance Analytics page.
 *
 * Single Supabase round-trip — all derived metrics (topContributors, weeklyTrends,
 * completionEfficiency, heatmapDays, analyticsCards) are computed from ONE logs batch.
 *
 * Eliminates the previous duplicate fetch pattern where ActivityHeatmap called
 * fetchActivityLogs independently for the same company/date range.
 *
 * @param {{ companyId: string, startDate: string, endDate: string }} params
 * @returns {Promise<Object>}
 */
export async function fetchTeamPerformanceData({ companyId, startDate, endDate }) {
  if (!companyId) {
    return {
      topContributors: [],
      projectStatusData: [],
      completionEfficiency: [],
      weeklyTrends: [],
      heatmapDays: [],
      analyticsCards: null,
      totalLogs: 0,
    }
  }

  analyticsService.setCompanyId(companyId)

  const [activityLogsResult, projectStatusData] = await Promise.all([
    fetchActivityLogs({ companyId, pageSize: 2000, startDate, endDate }),
    analyticsService.getProjectStatus(companyId),
  ])

  const logs = activityLogsResult?.logs || []

  // All derived data from the same logs batch — zero additional queries
  const topContributors = await computeTeamActivity(logs)

  // Weekly trends now respect the actual date range (not always "last 12 weeks from today")
  const weeklyTrends = buildWeeklyTrends(logs, startDate, endDate)

  // Heatmap derived from same logs batch — eliminates the second Supabase fetch
  const heatmapDays = buildHeatmapDays(logs, startDate, endDate)

  // Completion efficiency: per-contributor project action ratio
  const totalProjects = projectStatusData.reduce((sum, s) => sum + (s.value || 0), 0)
  const activeEntry = projectStatusData.find(
    (s) => s.name?.toLowerCase() === 'active'
  )
  const activeProjects = activeEntry?.value || 0
  const companyActiveRatio =
    totalProjects > 0 ? Math.round((activeProjects / totalProjects) * 100) : 0

  const completionEfficiency = topContributors.slice(0, 8).map((c) => {
    const activeDays = c.activeDays || 0
    const actionsPerDay =
      activeDays > 0 ? Math.round((c.totalActions / activeDays) * 10) / 10 : 0
    const totalProjectActions = c.projectsCreated + c.projectsUpdated
    const createdUpdatedRatio =
      c.projectsUpdated > 0
        ? Math.round((c.projectsCreated / c.projectsUpdated) * 10) / 10
        : c.projectsCreated > 0
          ? null // updated=0, can't form a ratio — treat as "all created"
          : 0
    return {
      name: c.name,
      totalActions: c.totalActions,
      projectsCreated: c.projectsCreated,
      projectsUpdated: c.projectsUpdated,
      activeRatio: companyActiveRatio,
      activeDays,
      actionsPerDay,
      createdUpdatedRatio,
      totalProjectActions,
    }
  })

  // All analytics cards — pure derivation from already-loaded data, zero network calls
  const analyticsCards = computeAnalyticsCards(topContributors, weeklyTrends, logs)

  return {
    topContributors,
    projectStatusData,
    completionEfficiency,
    weeklyTrends,
    heatmapDays,
    analyticsCards,
    totalLogs: activityLogsResult?.totalCount || 0,
  }
}
