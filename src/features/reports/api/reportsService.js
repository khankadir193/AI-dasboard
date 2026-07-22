import { supabase } from '../../../lib/supabaseClient'
import { REPORT_TYPES, getDefaultTitle, validateGeneratedContent } from './generators/reportGeneratorUtils'
import { generateWeeklyReport } from './generators/weeklyReportGenerator'
import { generateMonthlyReport } from './generators/monthlyReportGenerator'
import { generateTeamProductivityReport } from './generators/teamProductivityReportGenerator'
import { generateExecutiveSummaryReport } from './generators/executiveSummaryReportGenerator'

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

  const reportType = type
  const dateRange = content?.dateRange
  console.log('[Report Builder] reportType:', reportType)
  console.log('[Report Builder] dateRange:', dateRange)
  console.log('[Report Builder] generated report.content:', JSON.stringify(content, null, 2))

  if (!validateGeneratedContent(content)) {
    console.warn('[reportsService] Generated content validation produced low text volume, proceeding with available data', { type })
  }

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
  if (error) throw new Error('Failed to delete report')
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
