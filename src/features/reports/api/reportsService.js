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

const EMPTY_KPI = {
  activeUsers: 0, projectsCreated: 0, projectsUpdated: 0, projectsDeleted: 0, dashboardViews: 0,
}

const EMPTY_GROWTH = {
  activeUsers: 0, projectsCreated: 0, projectsUpdated: 0, projectsDeleted: 0, dashboardViews: 0,
}

function safeLabel(key) {
  return LABEL_MAP[key] || key
}

function getTypeSummary(type) {
  switch (type) {
    case 'weekly':
      return 'This weekly report covers the last 7 days of team activity, providing a snapshot of recent work, key metrics, and short-term trends to help teams stay aligned on immediate priorities.'
    case 'monthly':
      return 'This monthly report provides a comprehensive 30-day analysis of team performance, project progress, and operational metrics. Use this report to track long-term goals and identify recurring patterns.'
    case 'team_productivity':
      return 'This team productivity report analyzes 14 days of team activity, focusing on individual and group contributions, collaboration patterns, and workflow efficiency to help optimize team performance.'
    case 'executive_summary':
      return 'This executive summary provides a high-level 90-day overview of business performance, strategic KPIs, and key milestones. Designed for leadership to assess organizational health and direction.'
    default:
      return 'This report summarizes recent activity, key metrics, and recommendations based on your workspace data.'
  }
}

function generateInsights(kpiData, growthData, projectCount, activityCount, type) {
  const insights = []
  const totalEvents = Object.values(kpiData).reduce((a, b) => a + b, 0)

  if (totalEvents === 0 && activityCount === 0 && projectCount === 0) {
    insights.push('Your workspace is ready for action. Create projects, log activities, and track metrics to generate meaningful insights over time.')
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
  } else if (activityCount > 0 && activityCount < 10) {
    insights.push('Team activity is relatively low. Consider engaging team members to increase collaboration.')
  }

  if (type === 'weekly' && totalEvents > 0) {
    const avgPerDay = Math.round(totalEvents / 7)
    insights.push(`Average of ${avgPerDay} events per day this week.`)
  }

  if (type === 'monthly' && totalEvents > 0) {
    const avgPerDay = Math.round(totalEvents / 30)
    insights.push(`Sustained activity with an average of ${avgPerDay} events per day over the past month.`)
  }

  if (type === 'executive_summary' && totalEvents > 0) {
    const avgPerDay = Math.round(totalEvents / 90)
    insights.push(`Average of ${avgPerDay} events per day over the 90-day reporting period.`)
    if (projectCount > 0) {
      insights.push(`Portfolio of ${projectCount} project(s) managed during this period, reflecting ongoing business operations.`)
    }
  }

  if (type === 'team_productivity' && activityCount > 0) {
    insights.push(`Team generated ${activityCount} activity log entries over the reporting period, indicating active collaboration across the workspace.`)
  }

  if (insights.length === 0 && totalEvents > 0) {
    insights.push('Activity levels are stable with no significant changes detected.')
  }

  return insights
}

function generateRecommendations(kpiData, growthData, projectCount, activityCount, type) {
  const recommendations = []
  const totalEvents = Object.values(kpiData).reduce((a, b) => a + b, 0)

  if (projectCount === 0) {
    recommendations.push('Start creating projects to track your team\'s work effectively and unlock detailed analytics.')
  }

  if (totalEvents === 0 && activityCount === 0) {
    if (projectCount > 0) {
      recommendations.push('Your projects are set up but no activity has been recorded yet. Encourage your team to start logging their work.')
    }
    recommendations.push('Use the dashboard regularly to build up activity data, enabling more detailed future reports.')
    return recommendations
  }

  if (kpiData.projectsCreated === 0 && kpiData.projectsUpdated === 0 && projectCount > 0) {
    recommendations.push('No recent project modifications detected. Schedule a project review to ensure everything is on track.')
  }

  if (kpiData.activeUsers === 0) {
    recommendations.push('No user logins recorded in this period. Review access permissions and encourage team members to engage with the platform.')
  }

  if (growthData.activeUsers < -30) {
    recommendations.push('Significant drop in user activity. Investigate potential issues with onboarding, engagement, or access.')
  }

  if (projectCount > 0 && activityCount < 20 && totalEvents > 0) {
    recommendations.push('Projects exist but activity is low. Schedule a team check-in to identify blockers and re-prioritize workloads.')
  }

  if (kpiData.dashboardViews > 100) {
    recommendations.push('High dashboard usage indicates a strong data-driven culture. Consider expanding metrics and sharing insights across the organization.')
  }

  if (type === 'weekly' && kpiData.projectsCreated > 0) {
    recommendations.push('Strong project creation momentum this week. Plan the next sprint based on current velocity and team capacity.')
  } else if (type === 'weekly') {
    recommendations.push('Review this week\'s accomplishments and set clear priorities for the upcoming week to maintain momentum.')
  }

  if (type === 'monthly' && growthData.activeUsers > 0) {
    recommendations.push('User engagement is growing month-over-month. Invest in onboarding resources and feature adoption to sustain the trend.')
  } else if (type === 'monthly') {
    recommendations.push('Conduct a monthly retrospective to evaluate what worked well and identify areas for improvement in the coming month.')
  }

  if (type === 'team_productivity' && activityCount > 0) {
    recommendations.push('Recognize top contributors to maintain morale and encourage continued high performance across the team.')
    if (activityCount < 50) {
      recommendations.push('Consider implementing team-building activities or collaborative sessions to boost overall productivity.')
    }
  }

  if (type === 'executive_summary') {
    recommendations.push('Schedule a strategic review session to align on next quarter\'s priorities based on these insights and performance data.')
    if (projectCount > 5) {
      recommendations.push('With a growing project portfolio, consider delegating oversight and implementing scalable management processes.')
    }
  }

  if (recommendations.length === 0) {
    recommendations.push('Current metrics are healthy. Continue monitoring for any significant changes and maintain consistent team engagement.')
  }

  return recommendations
}

function buildTeamSummary(type, projectCount, totalEvents, activityCount, kpiData) {
  const parts = []

  if (projectCount > 0) {
    parts.push(`${projectCount} project(s)`)
  }

  if (totalEvents > 0) {
    parts.push(`${totalEvents} total analytics event(s)`)
  }

  if (activityCount > 0) {
    parts.push(`${activityCount} activity log entr(ies)`)
  }

  if (parts.length === 0) {
    return 'No activity recorded yet. Generate a report after using the platform to see your data summarized here.'
  }

  return parts.join(', ') + ' tracked during this reporting period.'
}

async function computeTeamActivity(logs) {
  if (!logs || logs.length === 0) return []

  const userMap = new Map()

  logs.forEach(log => {
    const uid = log.user_id
    if (!uid) return
    if (!userMap.has(uid)) {
      userMap.set(uid, { userId: uid, totalActions: 0, projectCreations: 0, logins: 0, dashboardViews: 0 })
    }
    const entry = userMap.get(uid)
    entry.totalActions++
    if (log.action === 'project_create') entry.projectCreations++
    if (log.action === 'login') entry.logins++
    if (log.action === 'dashboard_view') entry.dashboardViews++
  })

  const userIds = Array.from(userMap.keys())
  let profiles = []
  try {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', userIds)
    profiles = data || []
  } catch {}

  const profileMap = {}
  profiles.forEach(p => { profileMap[p.id] = p.full_name || p.email || 'Unknown' })

  return Array.from(userMap.values())
    .sort((a, b) => b.totalActions - a.totalActions)
    .map((entry, index) => ({
      rank: index + 1,
      name: profileMap[entry.userId] || 'Team Member',
      totalActions: entry.totalActions,
      projectsCreated: entry.projectCreations,
      logins: entry.logins,
      contributions: entry.totalActions,
    }))
}

function validateGeneratedContent(content) {
  if (!content) return false
  const textParts = [
    content.teamSummary,
    ...(content.insights || []),
    ...(content.recommendations || [])
  ].filter(Boolean)
  const totalLength = textParts.join(' ').trim().length
  return totalLength >= 50
}

function generateFallbackContent({ type, projects, kpiData, growthData, timelineData, projectStatusData, activityCount, totalEvents, dateRange }) {
  const now = new Date()
  const projectList = Array.isArray(projects) ? projects : []
  const activeProjects = projectList.filter(function(p) { return p.status === 'active' }).length
  const completionRate = projectList.length > 0 ? Math.round((activeProjects / projectList.length) * 100) : 0

  const typeSummary = getTypeSummary(type)

  const insights = []
  insights.push(typeSummary)
  insights.push('Report generated on ' + now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) + '.')
  insights.push('Total Projects: ' + projectList.length + ' (' + activeProjects + ' active, ' + completionRate + '% completion rate).')
  insights.push('Total events tracked: ' + totalEvents + '. Team activity count: ' + activityCount + '.')

  if (totalEvents > 0) {
    const topMetrics = Object.entries(kpiData)
      .filter(function(entry) { return entry[1] > 0 })
      .sort(function(a, b) { return b[1] - a[1] })
      .slice(0, 3)
      .map(function(entry) { return safeLabel(entry[0]) + ': ' + entry[1] })
    if (topMetrics.length > 0) {
      insights.push('Top metrics: ' + topMetrics.join(', ') + '.')
    }
  }

  const recommendations = []
  if (projectList.length === 0) {
    recommendations.push('Start creating projects to track your team\'s work effectively and generate meaningful analytics.')
  } else {
    recommendations.push('Continue monitoring project progress to ensure timely delivery and identify bottlenecks early.')
  }
  if (totalEvents === 0) {
    recommendations.push('Encourage team members to log their activities for better visibility into productivity patterns.')
  } else {
    recommendations.push('Maintain current activity levels for consistent productivity across the workspace.')
  }
  recommendations.push('Review and update project statuses regularly for accurate reporting and resource planning.')

  return {
    generatedAt: now.toISOString(),
    dateRange: dateRange || { startDate: 'N/A', endDate: now.toISOString().split('T')[0] },
    kpiData: kpiData,
    growthData: growthData || EMPTY_GROWTH,
    timelineData: timelineData || [],
    projectStatusData: projectStatusData || [],
    projectCount: projectList.length,
    activeProjects: activeProjects,
    completionRate: completionRate,
    activityCount: activityCount,
    totalEvents: totalEvents,
    insights: insights,
    recommendations: recommendations,
    reportSummary: typeSummary,
    teamSummary: buildTeamSummary(type, projectList.length, totalEvents, activityCount, kpiData),
  }
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
    const activityPageSize = type === REPORT_TYPES.TEAM_PRODUCTIVITY ? 1000 : 100

    const [kpiData, growthData, timelineData, projectStatusData, activityLogsResult] = await Promise.all([
      analyticsService.getKpiMetrics(dateRange.startDate, dateRange.endDate).catch(() => ({ ...EMPTY_KPI })),
      analyticsService.getGrowthMetrics(dateRange.startDate, dateRange.endDate).catch(() => ({ ...EMPTY_GROWTH })),
      analyticsService.getActivityTimeline(dateRange.startDate, dateRange.endDate).catch(() => []),
      analyticsService.getProjectStatus().catch(() => []),
      fetchActivityLogs({ companyId, pageSize: activityPageSize, startDate: dateRange.startDate, endDate: dateRange.endDate }).catch(() => ({ logs: [], totalCount: 0 })),
    ])

    const projects = await getProjects(companyId).catch(() => [])
    const projectCount = Array.isArray(projects) ? projects.length : 0
    const activityCount = activityLogsResult?.totalCount || 0
    const totalEvents = Object.values(kpiData).reduce((a, b) => a + b, 0)

    const insights = generateInsights(kpiData, growthData, projectCount, activityCount, type)
    const recommendations = generateRecommendations(kpiData, growthData, projectCount, activityCount, type)

    let content = {
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
      reportSummary: getTypeSummary(type),
      teamSummary: buildTeamSummary(type, projectCount, totalEvents, activityCount, kpiData),
    }

    if (type === REPORT_TYPES.TEAM_PRODUCTIVITY && activityLogsResult.logs?.length > 0) {
      content.teamActivity = await computeTeamActivity(activityLogsResult.logs)
      if (content.teamActivity.length > 0) {
        const top = content.teamActivity[0]
        insights.push(`Top contributor: ${top.name} with ${top.totalActions} actions during this period.`)
      }
    }

    if (!validateGeneratedContent(content)) {
      content = generateFallbackContent({ type, projects, kpiData, growthData, timelineData, projectStatusData, activityCount, totalEvents, dateRange })

      if (!validateGeneratedContent(content)) {
        throw new Error('Failed to generate sufficient report content')
      }
    }

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
