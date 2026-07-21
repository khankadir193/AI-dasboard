import { supabase } from '../../../lib/supabaseClient'
import { analyticsService } from '../../../services/analyticsService'
import { getProjects } from '../../../lib/projectsApi'
import { fetchActivityLogs } from '../../../services/activityLogService'
import { getAIInsight } from '../../../lib/apiClient'

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

async function generateAIReportContent(data, type) {
  const {
    kpiData, growthData, projectCount, activeProjects, completionRate,
    activityCount, totalEvents, avgDailyEvents, dateRange, projectStatusData,
    timelineData, teamActivity,
  } = data

  const kpiLines = [
    `- User Logins: ${kpiData?.activeUsers ?? 0}`,
    `- Projects Created: ${kpiData?.projectsCreated ?? 0}`,
    `- Projects Updated: ${kpiData?.projectsUpdated ?? 0}`,
    `- Projects Deleted: ${kpiData?.projectsDeleted ?? 0}`,
    `- Dashboard Views: ${kpiData?.dashboardViews ?? 0}`,
  ].join('\n')

  const growthLines = growthData && Object.keys(growthData).length > 0
    ? 'Growth vs Previous Period:\n' + Object.entries(growthData)
        .map(([k, v]) => `- ${safeLabel(k)}: ${v > 0 ? '+' : ''}${v}%`)
        .join('\n')
    : ''

  const statusLines = projectStatusData?.length
    ? 'Project Status:\n' + projectStatusData.map(p => `- ${p.name}: ${p.value}`).join('\n')
    : ''

  const teamLines = teamActivity?.length
    ? 'Top Team Contributors:\n' + teamActivity.slice(0, 5).map(m => `- ${m.name}: ${m.totalActions} actions (projects created: ${m.projectsCreated}, logins: ${m.logins})`).join('\n')
    : ''

  const typeLabels = {
    weekly: 'Weekly Report',
    monthly: 'Monthly Report',
    team_productivity: 'Team Productivity Report',
    executive_summary: 'Executive Summary',
  }

  const prompt = [
    `Generate a ${typeLabels[type] || 'Business Report'}.`,
    '',
    `Period: ${dateRange?.startDate || 'N/A'} to ${dateRange?.endDate || 'N/A'}`,
    '',
    'KPI Snapshot:',
    kpiLines,
    '',
    growthLines,
    '',
    `Projects: ${projectCount ?? 0} total, ${activeProjects ?? 0} active, ${completionRate ?? 0}% active rate`,
    `Total Analytics Events: ${totalEvents ?? 0}`,
    `Avg Daily Events: ${avgDailyEvents ?? 0}`,
    `Activity Log Entries: ${activityCount ?? 0}`,
    '',
    statusLines,
    teamLines ? '\n' + teamLines : '',
    '',
    'Return your analysis with two sections:',
    '',
    'INSIGHTS',
    '• 3-5 bullet points analyzing trends, anomalies, and patterns in the data above. Highlight key metrics with **bold**.',
    '',
    'RECOMMENDATIONS',
    '• 2-4 actionable next steps based on the data.',
  ].filter(Boolean).join('\n')

  try {
    const response = await getAIInsight(prompt, { maxTokens: 800, temperature: 0.3 })
    if (!response || response.length < 20) throw new Error('Empty AI response')

    const lines = response.split('\n')
    let recIdx = -1
    for (let i = 0; i < lines.length; i++) {
      if (/^recommendations?:?/i.test(lines[i].trim()) && lines[i].trim().length < 40) {
        recIdx = i
        break
      }
    }

    const extract = (sectionLines) => sectionLines
      .map(l => l.replace(/^[\s]*[•\-\*\d\.]+[\s\)]*/, '').trim())
      .filter(l => l.length > 10)
      .filter(l => !/^(insight|recommendation|analysis|data|based on|here |sure|according|the |this )/i.test(l))

    const insightLines = recIdx >= 0 ? lines.slice(0, recIdx) : lines
    const recLines = recIdx >= 0 ? lines.slice(recIdx + 1) : []
    const insights = extract(insightLines)
    const recommendations = extract(recLines)

    if (insights.length >= 1 || recommendations.length >= 1) {
      return {
        insights: insights.length >= 1 ? insights : ['Activity levels are stable with no significant anomalies detected.'],
        recommendations: recommendations.length >= 1 ? recommendations : ['Continue monitoring current metrics and maintain consistent team engagement.'],
      }
    }
  } catch (err) {
    console.warn('[Reports] AI generation failed, falling back to rule-based:', err.message)
  }

  return {
    insights: generateInsights(kpiData || {}, growthData || {}, projectCount || 0, activityCount || 0, type),
    recommendations: generateRecommendations(kpiData || {}, growthData || {}, projectCount || 0, activityCount || 0, type),
  }
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

  // Group by user_id and compute required counters.
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

    // Action names may vary; support common variants.
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

      // Required by your generator spec
      totalActions: entry.totalActions,
      projectsCreated: entry.projectsCreated,
      projectsUpdated: entry.projectsUpdated,
      logins: entry.logins,

      // PDF ignores this today but keep it for potential UI usage.
      contributions: entry.totalActions,
    }))
}

function validateGeneratedContent(content) {
  if (!content || typeof content !== 'object') return false
  const REQUIRED_KEYS = ['generatedAt', 'dateRange', 'kpiData', 'growthData', 'projectCount', 'totalEvents', 'insights', 'recommendations', 'reportSummary', 'teamSummary']
  for (const key of REQUIRED_KEYS) {
    if (!(key in content)) return false
  }
  const textParts = [
    content.teamSummary,
    ...(content.insights || []),
    ...(content.recommendations || [])
  ].filter(Boolean)
  const totalLength = textParts.join(' ').trim().length
  return totalLength >= 30
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
      // Strict rolling last 30 days (not "previous month")
      start.setDate(start.getDate() - 30)
      break
    case REPORT_TYPES.TEAM_PRODUCTIVITY:
      // Keep existing behavior unless you later require otherwise
      start.setDate(start.getDate() - 14)
      break
    case REPORT_TYPES.EXECUTIVE_SUMMARY:
      // Existing behavior: 90-day-like approximation by months.
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

  // Required by your spec: group activity_logs by user_id and populate teamActivity.
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

async function generateExecutiveSummaryReport({ companyId }) {
  const dateRange = await getDateRangeForType(REPORT_TYPES.EXECUTIVE_SUMMARY)

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
  const avgDailyEvents = Math.round(totalEvents / 90)

  const hasData = totalEvents > 0 || activityCount > 0 || projectCount > 0
  if (!hasData) {
    console.info('[Reports] Executive Summary report generated with no data for the selected period.')
  }

  // Leadership-focused insights/recommendations (still derived from KPI/growth for now),
  // but we will not include raw KPI tables in the PDF to avoid KPI-only duplication.
  const aiContent = await generateAIReportContent({
    kpiData, growthData, projectCount, activeProjects, completionRate,
    activityCount, totalEvents, avgDailyEvents, dateRange, projectStatusData, timelineData,
  }, REPORT_TYPES.EXECUTIVE_SUMMARY)
  const insights = aiContent.insights
  const recommendations = aiContent.recommendations

  // Leadership summary: prioritize strategic themes over raw metrics list.
  const leadershipSummaryParts = []
  leadershipSummaryParts.push(`${projectCount} total project(s) in scope (${activeProjects} active).`)
  leadershipSummaryParts.push(`${completionRate}% completion rate across the portfolio (approx).`)
  leadershipSummaryParts.push(`${activityCount} activity log entr(ies) captured across the organization.`)

  const teamSummary = leadershipSummaryParts.join(' ')

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
    reportSummary: getTypeSummary(REPORT_TYPES.EXECUTIVE_SUMMARY),
    teamSummary,
  }
}

export async function generateReport({ companyId, type, title, userId }) {
  if (!companyId) throw new Error('company_id is required')
  if (!type) throw new Error('report_type is required')

  const reportTitle = title || getDefaultTitle(type)
  if (!reportTitle) throw new Error('title is required')

  let content
  switch (type) {
    case REPORT_TYPES.WEEKLY:
      content = await generateWeeklyReport({ companyId })
      break
    case REPORT_TYPES.MONTHLY:
      content = await generateMonthlyReport({ companyId })
      break
    case REPORT_TYPES.TEAM_PRODUCTIVITY:
      content = await generateTeamProductivityReport({ companyId })
      break
    case REPORT_TYPES.EXECUTIVE_SUMMARY:
      content = await generateExecutiveSummaryReport({ companyId })
      break
    default:
      throw new Error(`Unknown report type: ${type}`)
  }

  // Temporary logs for tracing and validation (mandatory per spec)
  const reportType = type
  const dateRange = content?.dateRange
  console.log('[Report Builder] reportType:', reportType)
  console.log('[Report Builder] dateRange:', dateRange)
  console.log('[Report Builder] generated report.content:', JSON.stringify(content, null, 2))

  if (!validateGeneratedContent(content)) {
    console.warn('[reportsService] Generated content validation produced low text volume, proceeding with available data', { type })
  }

  // Trace what will be inserted into Supabase
  console.log('[Supabase Insert] generated_reports payload:', JSON.stringify({
    company_id: companyId,
    report_type: type,
    title: reportTitle,
    contentPreview: content && typeof content === 'object' ? {
      keys: Object.keys(content),
      dateRange: content?.dateRange,
    } : content,
  }, null, 2))

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

  console.log('[Supabase Insert] inserted report.content:', JSON.stringify(data?.content, null, 2))
  return data
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

export async function deleteReport(reportId, companyId) {
  if (!reportId) throw new Error('Report ID is required')

  let query = supabase
    .from('generated_reports')
    .delete()
    .eq('id', reportId)

  if (companyId) query = query.eq('company_id', companyId)

  const { error } = await query

  if (error) {
    throw new Error('Failed to delete report')
  }

  return true
}

export async function getReportById(reportId, companyId) {
  if (!reportId) throw new Error('Report ID is required')

  let query = supabase
    .from('generated_reports')
    .select('*')
    .eq('id', reportId)

  if (companyId) query = query.eq('company_id', companyId)

  const { data, error } = await query.maybeSingle()

  if (error) throw error
  if (!data) throw new Error('Report not found')
  return data
}

export { REPORT_TYPES }
