import { supabase } from '../../../../lib/supabaseClient'
import { analyticsService } from '../../../../services/analyticsService'
import { getProjects } from '../../../../lib/projectsApi'
import { fetchActivityLogs } from '../../../../services/activityLogService'
import { getDateRangeForType, buildTeamSummary, getTypeSummary, REPORT_TYPES } from './reportGeneratorUtils'
import { generateAIReportContent } from './aiContentGenerator'

async function computeTeamActivity(logs) {
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
      })
    }

    const entry = userMap.get(uid)
    entry.totalActions++

    if (log.action === 'project_create' || log.action === 'projects_created' || log.action === 'project_created') {
      entry.projectsCreated++
    }

    if (log.action === 'project_update' || log.action === 'project_updated' || log.action === 'projects_updated') {
      entry.projectsUpdated++
    }

    if (log.action === 'login' || log.action === 'logins' || log.action === 'user_login') {
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
  } catch { }

  const profileMap = {}
  profiles.forEach((p) => { profileMap[p.id] = p.full_name || p.email || 'Unknown' })

  return Array.from(userMap.values())
    .sort((a, b) => b.totalActions - a.totalActions)
    .map((entry, index) => ({
      rank: index + 1,
      name: profileMap[entry.userId] || 'Team Member',
      totalActions: entry.totalActions,
      projectsCreated: entry.projectsCreated,
      projectsUpdated: entry.projectsUpdated,
      logins: entry.logins,
      contributions: entry.totalActions,
    }))
}

async function generateTeamProductivityReport({ companyId }) {
  const dateRange = await getDateRangeForType(REPORT_TYPES.TEAM_PRODUCTIVITY)

  const [kpiData, projectStatusData, activityLogsResult] = await Promise.all([
    analyticsService.getKpiMetrics(dateRange.startDate, dateRange.endDate, companyId),
    analyticsService.getProjectStatus(companyId),
    fetchActivityLogs({ companyId, pageSize: 1000, startDate: dateRange.startDate, endDate: dateRange.endDate }),
  ])

  const projects = await getProjects(companyId)
  const projectList = Array.isArray(projects) ? projects : []
  const projectCount = projectList.length
  const activeProjects = projectList.filter(p => p.status === 'active').length
  const completionRate = projectCount > 0 ? Math.round((activeProjects / projectCount) * 100) : 0
  const activityCount = activityLogsResult?.totalCount || 0
  const totalEvents = Object.values(kpiData).reduce((a, b) => a + b, 0)
  const avgDailyEvents = Math.round(totalEvents / 14)

  const hasData = totalEvents > 0 || activityCount > 0 || projectCount > 0
  if (!hasData) {
    console.info('[Reports] Team Productivity report generated with no data for the selected period.')
  }

  let teamActivity = []
  const logs = activityLogsResult?.logs || []
  if (logs.length > 0) {
    teamActivity = await computeTeamActivity(logs)
  }

  const aiContent = await generateAIReportContent({
    kpiData, growthData: {}, projectCount, activeProjects, completionRate,
    activityCount, totalEvents, avgDailyEvents, dateRange, projectStatusData, teamActivity,
  }, REPORT_TYPES.TEAM_PRODUCTIVITY)
  const insights = aiContent.insights
  const recommendations = aiContent.recommendations

  if (teamActivity.length > 0) {
    const top = teamActivity[0]
    insights.push(`Top contributor: ${top.name} with ${top.totalActions} actions during this period.`)
  }

  return {
    generatedAt: new Date().toISOString(),
    dateRange,
    kpiData,
    growthData: {},
    timelineData: [],
    projectStatusData,
    projectCount,
    activeProjects,
    completionRate,
    activityCount,
    totalEvents,
    avgDailyEvents,
    insights,
    recommendations,
    reportSummary: getTypeSummary(REPORT_TYPES.TEAM_PRODUCTIVITY),
    teamSummary: buildTeamSummary(REPORT_TYPES.TEAM_PRODUCTIVITY, projectCount, totalEvents, activityCount, kpiData),
    teamActivity,
  }
}

export { generateTeamProductivityReport }
