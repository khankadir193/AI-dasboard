import { supabase } from '../../../lib/supabaseClient'
import { analyticsService } from '../../../services/analyticsService'
import { fetchActivityLogs } from '../../../services/activityLogService'
import { fetchNotifications } from '../../../features/notifications/api/notificationsService'
import { fetchReports } from '../../../features/reports/api/reportsService'

const contextCache = new Map()
const CACHE_TTL = 120000

function getCached(companyId) {
  const entry = contextCache.get(companyId)
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) return entry.data
  return null
}

function setCache(companyId, data) {
  contextCache.set(companyId, { data, timestamp: Date.now() })
}

function daysAgo(n) {
  return new Date(Date.now() - n * 86400000).toISOString().split('T')[0]
}

export async function fetchCompanyContext(companyId) {
  if (!companyId) return null

  const cached = getCached(companyId)
  if (cached) return cached

  const endDate = new Date().toISOString().split('T')[0]
  const startDate = daysAgo(30)

  const [projectsRes, kpiData, growthData, activityRes, notifsRes, reportsRes] = await Promise.allSettled([
    supabase.from('projects').select('status').eq('company_id', companyId),
    analyticsService.getKpiMetrics(startDate, endDate, companyId),
    analyticsService.getGrowthMetrics(startDate, endDate, companyId),
    fetchActivityLogs({ companyId, pageSize: 10, startDate, endDate }),
    fetchNotifications({ companyId, pageSize: 10, startDate, endDate }),
    fetchReports({ companyId, pageSize: 5 }),
  ])

  const projects = projectsRes.status === 'fulfilled'
    ? (() => {
        const rows = projectsRes.value.data || []
        const total = rows.length
        const active = rows.filter(p => p.status === 'active').length
        const inactive = rows.filter(p => p.status === 'inactive').length
        const archived = rows.filter(p => p.status === 'archived').length
        return { total, active, inactive, archived }
      })()
    : { total: 0, active: 0, inactive: 0, archived: 0 }

  const analytics = {
    kpiData: kpiData.status === 'fulfilled' ? kpiData.value : {},
    growthData: growthData.status === 'fulfilled' ? growthData.value : {},
  }

  const activityLogs = activityRes.status === 'fulfilled'
    ? { totalCount: activityRes.value.totalCount, recent: activityRes.value.logs.slice(0, 10) }
    : { totalCount: 0, recent: [] }

  const notifications = notifsRes.status === 'fulfilled'
    ? { totalCount: notifsRes.value.totalCount, recent: notifsRes.value.notifications.slice(0, 10) }
    : { totalCount: 0, recent: [] }

  const reports = reportsRes.status === 'fulfilled'
    ? { totalCount: reportsRes.value.totalCount, recent: reportsRes.value.reports.slice(0, 5) }
    : { totalCount: 0, recent: [] }

  const context = { projects, analytics, activityLogs, notifications, reports, period: { startDate, endDate } }

  setCache(companyId, context)
  return context
}

export function formatContextForPrompt(ctx) {
  if (!ctx) return ''

  const { projects, analytics, activityLogs, notifications, reports, period } = ctx
  const lines = []

  lines.push('[COMPANY DATA CONTEXT]')
  lines.push(`Period: ${period.startDate} to ${period.endDate}`)
  lines.push('')

  lines.push('Projects:')
  lines.push(`- Total: ${projects.total}, Active: ${projects.active}, Inactive: ${projects.inactive}, Archived: ${projects.archived}`)
  lines.push('')

  const kpi = analytics.kpiData || {}
  const growth = analytics.growthData || {}
  lines.push('Analytics KPIs (last 30 days):')
  lines.push(`- User Logins: ${kpi.activeUsers ?? 0}`)
  lines.push(`- Projects Created: ${kpi.projectsCreated ?? 0}`)
  lines.push(`- Projects Updated: ${kpi.projectsUpdated ?? 0}`)
  lines.push(`- Projects Deleted: ${kpi.projectsDeleted ?? 0}`)
  lines.push(`- Dashboard Views: ${kpi.dashboardViews ?? 0}`)

  const growthEntries = Object.entries(growth).filter(([, v]) => v !== 0)
  if (growthEntries.length > 0) {
    lines.push('Growth vs Previous Period:')
    growthEntries.forEach(([key, val]) => {
      lines.push(`- ${key}: ${val > 0 ? '+' : ''}${val}%`)
    })
  }
  lines.push('')

  lines.push(`Activity Log Entries: ${activityLogs.totalCount}`)
  if (activityLogs.recent.length > 0) {
    lines.push('Recent Activity:')
    activityLogs.recent.forEach(log => {
      lines.push(`- [${log.action}] ${log.description || ''} (${log.created_at || ''})`)
    })
  }
  lines.push('')

  lines.push(`Notifications: ${notifications.totalCount} total`)
  lines.push(`Generated Reports Available: ${reports.totalCount}`)
  if (reports.recent.length > 0) {
    const types = [...new Set(reports.recent.map(r => r.report_type))]
    lines.push(`Report Types Generated: ${types.join(', ')}`)
  }
  lines.push('')

  lines.push('---')
  lines.push('Analyze the company data above in context of the user request below.')
  lines.push('Structure your response EXACTLY as follows:')
  lines.push('')
  lines.push('## Summary')
  lines.push('[2-3 sentence executive summary of the key findings]')
  lines.push('')
  lines.push('## Findings')
  lines.push('[3-5 bullet-point findings with **bold** for key metrics]')
  lines.push('')
  lines.push('## Recommendations')
  lines.push('[2-4 actionable recommendations]')
  lines.push('---')

  return lines.join('\n')
}
