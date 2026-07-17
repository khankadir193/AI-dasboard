import { supabase } from '../../../lib/supabaseClient'
import { analyticsService } from '../../../services/analyticsService'
import { getProjects } from '../../../lib/projectsApi'
import { fetchActivityLogs } from '../../../services/activityLogService'

const REPORT_TYPES = {
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  TEAM_PRODUCTIVITY: 'team_productivity',
  EXECUTIVE_SUMMARY: 'executive_summary',
}

const LABEL_MAP = {
  active_users: 'User Logins',
  projects_created: 'Projects Created',
  projects_updated: 'Projects Updated',
  projects_deleted: 'Projects Deleted',
  dashboard_view: 'Dashboard Views',
}

function safeLabel(key) {
  return LABEL_MAP[key] || key
}

function computeTrend(current, previous) {
  if (!previous || previous === 0) return { direction: 'stable', percentage: 0 }
  const pct = Math.round(((current - previous) / previous) * 100)
  if (pct > 5) return { direction: 'up', percentage: pct }
  if (pct < -5) return { direction: 'down', percentage: Math.abs(pct) }
  return { direction: 'stable', percentage: 0 }
}

function generateInsights(kpiData, growthData, projectCount, activityCount) {
  const insights = []
  const totalEvents = Object.values(kpiData).reduce((a, b) => a + b, 0)

  if (totalEvents === 0) {
    insights.push('No activity data available for this period. Start using the platform to generate insights.')
    return insights
  }

  const topEvent = Object.entries(kpiData).sort((a, b) => b[1] - a[1])[0]
  if (topEvent && topEvent[1] > 0) {
    insights.push(`${safeLabel(topEvent[0])} was the most frequent activity with ${topEvent[1]} events tracked.`)
  }

  Object.entries(growthData).forEach(([key, growth]) => {
    if (growth > 20) {
      insights.push(`${safeLabel(key)} increased by ${growth}% compared to the previous period.`)
    } else if (growth < -20) {
      insights.push(`${safeLabel(key)} decreased by ${Math.abs(growth)}% compared to the previous period.`)
    }
  })

  if (projectCount > 0) {
    insights.push(`${projectCount} project(s) were active during this period.`)
  }

  if (activityCount > 50) {
    insights.push('High level of team activity detected across the workspace.')
  } else if (activityCount < 10 && totalEvents > 0) {
    insights.push('Team activity is relatively low. Consider engaging team members.')
  }

  if (insights.length === 0) {
    insights.push('Activity levels are stable with no significant changes detected.')
  }

  return insights
}

function generateRecommendations(kpiData, growthData, projectCount, activityCount) {
  const recommendations = []

  if (kpiData.projectsCreated === 0 && kpiData.projectsUpdated === 0) {
    recommendations.push('No project activity detected. Consider reviewing project goals and timelines.')
  }

  if (kpiData.activeUsers === 0) {
    recommendations.push('No user logins recorded. Review access and encourage team engagement.')
  }

  if (growthData.activeUsers < -30) {
    recommendations.push('Significant drop in user activity. Investigate potential issues with onboarding or engagement.')
  }

  if (projectCount > 0 && activityCount < 20) {
    recommendations.push('Projects exist but activity is low. Schedule a team check-in to identify blockers.')
  }

  if (kpiData.dashboardViews > 100) {
    recommendations.push('High dashboard usage indicates strong data-driven culture. Consider adding more metrics.')
  }

  if (recommendations.length === 0) {
    recommendations.push('Current metrics are healthy. Continue monitoring for any significant changes.')
  }

  return recommendations
}

async function getDateRangeForType(type) {
  const now = new Date()
  const end = now.toISOString().split('T')[0]
  const start = new Date(now)

  switch (type) {
    case REPORT_TYPES.WEEKLY:
      start.setDate(start.getDate() - 7)
      break
    case REPORT_TYPES.MONTHLY:
      start.setMonth(start.getMonth() - 1)
      break
    case REPORT_TYPES.TEAM_PRODUCTIVITY:
      start.setDate(start.getDate() - 14)
      break
    case REPORT_TYPES.EXECUTIVE_SUMMARY:
      start.setMonth(start.getMonth() - 3)
      break
    default:
      start.setDate(start.getDate() - 30)
  }

  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end,
  }
}

function getDefaultTitle(type) {
  const now = new Date()
  const dateStr = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  switch (type) {
    case REPORT_TYPES.WEEKLY:
      return `Weekly Report — ${dateStr}`
    case REPORT_TYPES.MONTHLY:
      return `Monthly Report — ${now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
    case REPORT_TYPES.TEAM_PRODUCTIVITY:
      return `Team Productivity Report — ${dateStr}`
    case REPORT_TYPES.EXECUTIVE_SUMMARY:
      return `Executive Summary — ${now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
    default:
      return `Report — ${dateStr}`
  }
}

export async function generateReport({ companyId, type, title, userId }) {
  if (!companyId) throw new Error('company_id is required')
  if (!type) throw new Error('report_type is required')

  const dateRange = await getDateRangeForType(type)
  const reportTitle = title || getDefaultTitle(type)

  if (!reportTitle) throw new Error('title is required')

  analyticsService.setCompanyId(companyId)

  try {
    const [kpiData, growthData, timelineData, projectStatusData, activityLogsResult] = await Promise.all([
      analyticsService.getKpiMetrics(dateRange.startDate, dateRange.endDate).catch(() => ({
        activeUsers: 0, projectsCreated: 0, projectsUpdated: 0, projectsDeleted: 0, dashboardViews: 0
      })),
      analyticsService.getGrowthMetrics(dateRange.startDate, dateRange.endDate).catch(() => ({
        activeUsers: 0, projectsCreated: 0, projectsUpdated: 0, projectsDeleted: 0, dashboardViews: 0
      })),
      analyticsService.getActivityTimeline(dateRange.startDate, dateRange.endDate).catch(() => []),
      analyticsService.getProjectStatus().catch(() => []),
      fetchActivityLogs({ companyId, pageSize: 100 }).catch(() => ({ logs: [], totalCount: 0 })),
    ])

    const projects = await getProjects(companyId).catch(() => [])
    const projectCount = Array.isArray(projects) ? projects.length : 0
    const activityCount = activityLogsResult?.totalCount || 0
    const totalEvents = Object.values(kpiData).reduce((a, b) => a + b, 0)

    const insights = generateInsights(kpiData, growthData, projectCount, activityCount)
    const recommendations = generateRecommendations(kpiData, growthData, projectCount, activityCount)

    const content = {
      generatedAt: new Date().toISOString(),
      dateRange,
      kpiData,
      growthData,
      timelineData,
      projectStatusData,
      projectCount,
      activityCount,
      totalEvents,
      insights,
      recommendations,
      teamSummary: projectCount > 0
        ? `${projectCount} project(s) with ${totalEvents} total events tracked. ${activityCount} activity log entries recorded.`
        : 'No projects found for this period.',
    }

    if (!content) throw new Error('content is required')

    const { data, error } = await supabase
      .from('generated_reports')
      .insert({
        company_id: companyId,
        report_type: type,
        title: reportTitle,
        content,
        created_by: userId || null,
      })
      .select()
      .maybeSingle()

    if (error) throw error
    if (!data) throw new Error('Failed to save report')

    return data
  } catch (error) {
    console.error('[reportsService] generateReport error:', error)
    throw error
  }
}

export async function fetchReports({ companyId, page = 1, pageSize = 10, type }) {
  if (!companyId) return { reports: [], totalCount: 0, page: 1, pageSize }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  try {
    let query = supabase
      .from('generated_reports')
      .select('*', { count: 'exact' })
      .eq('company_id', companyId)

    if (type) query = query.eq('report_type', type)

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) throw error

    return {
      reports: data || [],
      totalCount: count || 0,
      page,
      pageSize,
    }
  } catch (error) {
    console.error('[reportsService] fetchReports error:', error)
    throw new Error('Failed to fetch reports')
  }
}

export async function deleteReport(reportId) {
  if (!reportId) throw new Error('Report ID is required')

  const { error } = await supabase
    .from('generated_reports')
    .delete()
    .eq('id', reportId)

  if (error) {
    console.error('[reportsService] deleteReport error:', error)
    throw new Error('Failed to delete report')
  }

  return true
}

export async function getReportById(reportId) {
  if (!reportId) throw new Error('Report ID is required')

  const { data, error } = await supabase
    .from('generated_reports')
    .select('*')
    .eq('id', reportId)
    .maybeSingle()

  if (error) throw error
  if (!data) throw new Error('Report not found')
  return data
}

export { REPORT_TYPES }
