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

const REPORT_TYPES = {
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  TEAM_PRODUCTIVITY: 'team_productivity',
  EXECUTIVE_SUMMARY: 'executive_summary',
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

function buildTeamSummary(type, projectCount, totalEvents, activityCount, kpiData) {
  const parts = []
  if (projectCount > 0) parts.push(`${projectCount} project(s)`)
  if (totalEvents > 0) parts.push(`${totalEvents} total analytics event(s)`)
  if (activityCount > 0) parts.push(`${activityCount} activity log entr(ies)`)
  if (parts.length === 0) return 'No activity recorded yet. Generate a report after using the platform to see your data summarized here.'
  return parts.join(', ') + ' tracked during this reporting period.'
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
      start.setDate(start.getDate() - 30)
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
  return { startDate: start.toISOString().split('T')[0], endDate: end }
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

function validateGeneratedContent(content) {
  if (!content || typeof content !== 'object') return false
  const REQUIRED_KEYS = ['generatedAt', 'dateRange', 'kpiData', 'growthData', 'projectCount', 'totalEvents', 'insights', 'recommendations', 'reportSummary', 'teamSummary']
  for (const key of REQUIRED_KEYS) {
    if (!(key in content)) return false
  }
  const textParts = [content.teamSummary, ...(content.insights || []), ...(content.recommendations || [])].filter(Boolean)
  const totalLength = textParts.join(' ').trim().length
  return totalLength >= 30
}

export { LABEL_MAP, safeLabel, REPORT_TYPES, getTypeSummary, buildTeamSummary, getDateRangeForType, getDefaultTitle, validateGeneratedContent }
