import { analyticsService } from '../../../../services/analyticsService'
import { getProjects } from '../../../../lib/projectsApi'
import { fetchActivityLogs } from '../../../../services/activityLogService'
import { getDateRangeForType, buildTeamSummary, getTypeSummary, REPORT_TYPES } from './reportGeneratorUtils'
import { generateAIReportContent } from './aiContentGenerator'

async function generateWeeklyReport({ companyId }) {
  const dateRange = await getDateRangeForType(REPORT_TYPES.WEEKLY)

  const [kpiData, timelineData, projectStatusData, activityLogsResult] = await Promise.all([
    analyticsService.getKpiMetrics(dateRange.startDate, dateRange.endDate, companyId),
    analyticsService.getActivityTimeline(dateRange.startDate, dateRange.endDate, companyId),
    analyticsService.getProjectStatus(companyId),
    fetchActivityLogs({ companyId, pageSize: 100, startDate: dateRange.startDate, endDate: dateRange.endDate }),
  ])

  const projects = await getProjects(companyId)
  const projectList = Array.isArray(projects) ? projects : []
  const projectCount = projectList.length
  const activeProjects = projectList.filter(p => p.status === 'active').length
  const completionRate = projectCount > 0 ? Math.round((activeProjects / projectCount) * 100) : 0
  const activityCount = activityLogsResult?.totalCount || 0
  const totalEvents = Object.values(kpiData).reduce((a, b) => a + b, 0)
  const avgDailyEvents = Math.round(totalEvents / 7)

  const hasData = totalEvents > 0 || activityCount > 0 || projectCount > 0
  if (!hasData) {
    console.info('[Reports] Weekly report generated with no data for the selected period.')
  }

  const aiContent = await generateAIReportContent({
    kpiData, growthData: {}, projectCount, activeProjects, completionRate,
    activityCount, totalEvents, avgDailyEvents, dateRange, projectStatusData,
  }, REPORT_TYPES.WEEKLY)
  const insights = aiContent.insights
  const recommendations = aiContent.recommendations

  return {
    generatedAt: new Date().toISOString(),
    dateRange,
    kpiData,
    growthData: {},
    timelineData,
    projectStatusData,
    projectCount,
    activeProjects,
    completionRate,
    activityCount,
    totalEvents,
    avgDailyEvents,
    insights,
    recommendations,
    reportSummary: getTypeSummary(REPORT_TYPES.WEEKLY),
    teamSummary: buildTeamSummary(REPORT_TYPES.WEEKLY, projectCount, totalEvents, activityCount, kpiData),
  }
}

export { generateWeeklyReport }
