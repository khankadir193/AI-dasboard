import { analyticsService } from '../../../../services/analyticsService'
import { getProjects } from '../../../../lib/projectsApi'
import { fetchActivityLogs } from '../../../../services/activityLogService'
import { getDateRangeForType, buildTeamSummary, getTypeSummary, REPORT_TYPES } from './reportGeneratorUtils'
import { generateAIReportContent } from './aiContentGenerator'

async function generateMonthlyReport({ companyId }) {
  const dateRange = await getDateRangeForType(REPORT_TYPES.MONTHLY)

  const [kpiData, growthData, timelineData, projectStatusData, activityLogsResult] = await Promise.all([
    analyticsService.getKpiMetrics(dateRange.startDate, dateRange.endDate, companyId),
    analyticsService.getGrowthMetrics(dateRange.startDate, dateRange.endDate, companyId),
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
  const avgDailyEvents = Math.round(totalEvents / 30)

  const hasData = totalEvents > 0 || activityCount > 0 || projectCount > 0
  if (!hasData) {
    console.info('[Reports] Monthly report generated with no data for the selected period.')
  }

  const aiContent = await generateAIReportContent({
    kpiData, growthData, projectCount, activeProjects, completionRate,
    activityCount, totalEvents, avgDailyEvents, dateRange, projectStatusData, timelineData,
  }, REPORT_TYPES.MONTHLY)
  const insights = aiContent.insights
  const recommendations = aiContent.recommendations

  return {
    generatedAt: new Date().toISOString(),
    dateRange,
    kpiData,
    growthData,
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
    reportSummary: getTypeSummary(REPORT_TYPES.MONTHLY),
    teamSummary: buildTeamSummary(REPORT_TYPES.MONTHLY, projectCount, totalEvents, activityCount, kpiData),
  }
}

export { generateMonthlyReport }
