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
        logins: 0,
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

    if (
      log.action === 'login' ||
      log.action === 'logins' ||
      log.action === 'user_login'
    ) {
      entry.logins++
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

  return Array.from(userMap.values())
    .sort((a, b) => b.totalActions - a.totalActions)
    .map((entry, index) => ({
      rank: index + 1,
      userId: entry.userId,
      name: profileMap[entry.userId] || 'Team Member',
      totalActions: entry.totalActions,
      projectsCreated: entry.projectsCreated,
      projectsUpdated: entry.projectsUpdated,
      logins: entry.logins,
      activeDays: entry.activeDays.size,
      contributions: entry.totalActions, // alias kept for report compatibility
    }))
}

/**
 * Groups activity logs by ISO week (Monday-anchored) and returns the last
 * `numWeeks` weekly totals. Used for the Weekly Activity Trends chart.
 * Shape differs from analyticsService._buildTimeline (daily, day-numeric label)
 * so this lives here rather than reusing that method.
 *
 * @param {Array} logs - activity_logs rows
 * @param {number} numWeeks - number of past weeks to return (default 12)
 * @returns {Array<{ week: string, label: string, count: number }>}
 */
function buildWeeklyTrends(logs, numWeeks = 12) {
  const weekMap = new Map()

  logs.forEach((log) => {
    const d = new Date(log.created_at)
    if (isNaN(d.getTime())) return

    // Snap to the Monday of this log's week
    const dow = d.getDay() // 0 = Sun
    const diffToMon = dow === 0 ? -6 : 1 - dow
    const monday = new Date(d)
    monday.setDate(d.getDate() + diffToMon)
    monday.setHours(0, 0, 0, 0)

    const weekKey = monday.toISOString().split('T')[0]
    weekMap.set(weekKey, (weekMap.get(weekKey) || 0) + 1)
  })

  // Generate the last numWeeks week slots anchored to this Monday
  const now = new Date()
  const dow = now.getDay()
  const diffToMon = dow === 0 ? -6 : 1 - dow
  const thisMonday = new Date(now)
  thisMonday.setDate(now.getDate() + diffToMon)
  thisMonday.setHours(0, 0, 0, 0)

  const result = []
  for (let i = numWeeks - 1; i >= 0; i--) {
    const weekStart = new Date(thisMonday)
    weekStart.setDate(thisMonday.getDate() - i * 7)
    const weekKey = weekStart.toISOString().split('T')[0]
    const label = weekStart.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
    result.push({ week: weekKey, label, count: weekMap.get(weekKey) || 0 })
  }

  return result
}

/**
 * Fetches all data needed for the Team Performance Analytics page.
 *
 * Reuses:
 *   - fetchActivityLogs (activityLogService) — activity data source
 *   - analyticsService.getProjectStatus — project status breakdown
 *
 * Derives (no extra queries):
 *   - topContributors — from computeTeamActivity
 *   - weeklyTrends — from buildWeeklyTrends over the same logs batch
 *   - completionEfficiency — per-contributor action breakdown
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
      totalLogs: 0,
    }
  }

  analyticsService.setCompanyId(companyId)

  const [activityLogsResult, projectStatusData] = await Promise.all([
    fetchActivityLogs({ companyId, pageSize: 1000, startDate, endDate }),
    analyticsService.getProjectStatus(companyId),
  ])

  const logs = activityLogsResult?.logs || []
  const topContributors = await computeTeamActivity(logs)

  // Completion efficiency: per-contributor project action ratio.
  // Company-level active/total ratio overlaid onto top-N contributors.
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
      totalActions: c.totalActions,        // ← Bug #1 fix: field was missing
      projectsCreated: c.projectsCreated,
      projectsUpdated: c.projectsUpdated,
      activeRatio: companyActiveRatio,
      activeDays,
      actionsPerDay,
      createdUpdatedRatio,
      totalProjectActions,
    }
  })

  // Weekly trends derived from the same logs batch (no additional query)
  const weeklyTrends = buildWeeklyTrends(logs, 12)

  return {
    topContributors,
    projectStatusData,
    completionEfficiency,
    weeklyTrends,
    totalLogs: activityLogsResult?.totalCount || 0,
  }
}
