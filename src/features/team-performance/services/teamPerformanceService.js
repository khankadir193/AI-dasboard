import { supabase } from '../../../lib/supabaseClient'
import { fetchActivityLogs } from '../../../services/activityLogService'
import { analyticsService } from '../../../services/analyticsService'

/** Aggregate activity logs by user_id into per-user action metrics. */
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
        activeDays: new Set(),
      })
    }

    const entry = userMap.get(uid)
    entry.totalActions++

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
    // Fallback to default name if profile lookup fails
  }

  const profileMap = {}
  profiles.forEach((p) => {
    profileMap[p.id] = p.full_name || p.email || 'Unknown'
  })

  const teamTotal = Array.from(userMap.values()).reduce((s, e) => s + e.totalActions, 0)

  const sorted = Array.from(userMap.values())
    .sort((a, b) => b.totalActions - a.totalActions)

  let rank = 1 // Handles tie ranking
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
      contributions: entry.totalActions,
    }
  })
}

/** Group activity logs into time buckets based on date range. */
function buildWeeklyTrends(logs, startDate, endDate) {
  const start = new Date(startDate + 'T00:00:00Z')
  const end = new Date(endDate + 'T23:59:59Z')
  const diffDays = Math.round((end - start) / (1000 * 60 * 60 * 24))

  if (diffDays <= 1) {
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

  // Snap each log to its ISO Monday
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

const DOW_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

/** Derive analytics card values from a single pass over activity logs. */
function computeAnalyticsCards(topContributors, weeklyTrends, logs) {
  const topContributor = topContributors[0]?.name ?? null

  const totalActions = topContributors.reduce((s, c) => s + c.totalActions, 0)
  const memberCount = topContributors.length
  const avgActionsPerUser =
    memberCount > 0 ? Math.round((totalActions / memberCount) * 10) / 10 : null

  let weeklyGrowth = null
  if (weeklyTrends.length >= 2) {
    const lastBucket = weeklyTrends[weeklyTrends.length - 1]?.count ?? 0
    const prevBucket = weeklyTrends[weeklyTrends.length - 2]?.count ?? 0
    if (prevBucket > 0) {
      weeklyGrowth = Math.round(((lastBucket - prevBucket) / prevBucket) * 100)
    } else if (lastBucket > 0) {
      weeklyGrowth = 100
    }
  }

  const activeMembers = memberCount

  const activeDates = new Set()
  logs.forEach((log) => {
    const date = log.created_at?.split('T')[0]
    if (date) activeDates.add(date)
  })
  const avgDailyActions =
    activeDates.size > 0 ? Math.round((totalActions / activeDates.size) * 10) / 10 : null

  const totalActiveDays = topContributors.reduce((s, c) => s + c.activeDays, 0)
  const teamEfficiency =
    totalActiveDays > 0 ? Math.round((totalActions / totalActiveDays) * 10) / 10 : null

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

  let mostActiveWeek = null
  let mostActiveWeekCount = 0
  weeklyTrends.forEach((w) => {
    if (w.count > mostActiveWeekCount) {
      mostActiveWeekCount = w.count
      mostActiveWeek = w.label
    }
  })

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

/** Group activity logs into per-day heatmap cells. */
export function buildHeatmapDays(logs, startDate, endDate) {
  if (!startDate || !endDate) return []

  const dayMap = new Map()

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

  const getTopAction = (actionMap) => {
    let top = null
    let topCount = 0
    actionMap.forEach((count, action) => {
      if (count > topCount) {
        topCount = count
        top = action
      }
    })
    return top
      ? top.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
      : null
  }

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
      dayOfWeek: cursor.getUTCDay(),
      contributors: entry?.users.size || 0,
      topAction: entry ? getTopAction(entry.actions) : null,
    })
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }

  return days
}

/** Fetch all team performance data for the given company and date range. */
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

  const topContributors = await computeTeamActivity(logs)
  const weeklyTrends = buildWeeklyTrends(logs, startDate, endDate)
  const heatmapDays = buildHeatmapDays(logs, startDate, endDate)

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
          ? null
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
