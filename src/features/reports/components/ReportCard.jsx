import { useState } from 'react'
import { Download, Trash2, ChevronDown, ChevronUp, FileText, BarChart3, Lightbulb, Target, Clock } from 'lucide-react'
import { exportReportToPDF, downloadPDF } from '../../../services/pdfExportService'
import { formatDate, getTypeLabel, getMetricLabel, TYPE_ICONS_MAP } from '../utils/reportHelpers'

export default function ReportCard({ report, profile, onDelete, isDeleting }) {
  const [expanded, setExpanded] = useState(false)
  const [exporting, setExporting] = useState(false)

  const typeStyle = TYPE_ICONS_MAP[report.report_type] || TYPE_ICONS_MAP.weekly
  const IconMap = { FileText, BarChart3, Target, Clock }
  const Icon = IconMap[typeStyle.icon] || FileText
  const content = typeof report.content === 'string'
    ? (() => { try { return JSON.parse(report.content) } catch { return {} } })()
    : (report.content || {})

  const handleExport = async () => {
    if (!report?.content || typeof report.content !== 'object') {
      console.warn('[ReportCard] Report content is missing or invalid, PDF will use available data', { reportId: report?.id, reportType: report?.report_type })
    }
    setExporting(true)
    try {
      const companyData = profile?.companies
      const companyObj = Array.isArray(companyData) ? companyData[0] : companyData
      const company = { name: companyObj?.name || 'InsightAI' }
      const doc = exportReportToPDF(report, company)
      downloadPDF(doc, `report-${report.report_type}-${report.id?.slice(0, 8)}`)
    } catch (err) {
      console.error('[ReportCard] Export failed:', err)
    } finally {
      setExporting(false)
    }
  }

  const kpiEntries = content.kpiData
    ? Object.entries(content.kpiData).filter(([, v]) => v > 0)
    : []

  return (
    <div className="card p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={`w-10 h-10 rounded-xl ${typeStyle.bg} flex items-center justify-center flex-shrink-0`}>
            <Icon size={20} className={typeStyle.color} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-white truncate">{report.title}</h3>
            <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-gray-500">
              <span className="font-medium text-blue-600 dark:text-blue-400">{getTypeLabel(report.report_type)}</span>
              <span>•</span>
              <span>{formatDate(report.created_at)}</span>
              {kpiEntries.length > 0 && (
                <>
                  <span>•</span>
                  <span>{kpiEntries.length} metrics</span>
                </>
              )}
              {content.insights?.length > 0 && (
                <>
                  <span>•</span>
                  <span>{content.insights.length} insights</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="p-2 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
            title="Export PDF"
          >
            <Download size={16} className={exporting ? 'animate-pulse' : ''} />
          </button>
          <button
            onClick={() => onDelete(report.id)}
            disabled={isDeleting}
            className="p-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
            title="Delete report"
          >
            <Trash2 size={16} />
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 space-y-4">
          {content.teamSummary && (
            <p className="text-sm text-gray-600 dark:text-gray-400">{content.teamSummary}</p>
          )}

          {kpiEntries.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <BarChart3 size={14} /> Key Metrics
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                {kpiEntries.map(([key, value]) => (
                  <div key={key} className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-2 text-center">
                    <p className="text-[10px] text-gray-500 truncate">{getMetricLabel(key)}</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {content.insights?.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Lightbulb size={14} /> Insights
              </h4>
              <ul className="space-y-1">
                {content.insights.map((insight, i) => (
                  <li key={i} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {content.recommendations?.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Target size={14} /> Recommendations
              </h4>
              <ul className="space-y-1">
                {content.recommendations.map((rec, i) => (
                  <li key={i} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                    <span className="text-amber-500 mt-0.5">→</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {content.dateRange && (
            <p className="text-[10px] text-gray-400">
              Period: {content.dateRange.startDate} — {content.dateRange.endDate}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
