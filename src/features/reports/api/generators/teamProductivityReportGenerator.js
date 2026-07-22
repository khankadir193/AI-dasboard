import { analyticsService } from '../../../../services/analyticsService'
import { getProjects } from '../../../../lib/projectsApi'
import { fetchActivityLogs } from '../../../../services/activityLogService'
import { getDateRangeForType, buildTeamSummary, getTypeSummary, REPORT_TYPES } from './reportGeneratorUtils'
import { generateAIReportContent } from './aiContentGenerator'
// computeTeamActivity extracted to shared service (features/team-performance) to avoid
// duplication between the Reports generator and the Team Performance page.
import { computeTeamActivity } from '../../../../features/team-performance/services/teamPerformanceService'


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
