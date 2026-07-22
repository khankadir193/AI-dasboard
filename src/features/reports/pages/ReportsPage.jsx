import { useState } from 'react'
import { useSelector } from 'react-redux'
import { AlertCircle } from 'lucide-react'
import { useReports, useGenerateReport, useDeleteReport } from '../hooks/useReports'
import ReportCard from '../components/ReportCard'
import ReportGenerator from '../components/ReportGenerator'
import ReportsSkeleton from '../components/ReportsSkeleton'
import ReportsEmptyState from '../components/ReportsEmptyState'
import FeatureGate from '../../../components/auth/FeatureGate'
import { REPORT_TYPES } from '../api/reportsService'

const TYPE_OPTIONS = [
  { value: '', label: 'All Reports' },
  { value: REPORT_TYPES.WEEKLY, label: 'Weekly' },
  { value: REPORT_TYPES.MONTHLY, label: 'Monthly' },
  { value: REPORT_TYPES.TEAM_PRODUCTIVITY, label: 'Team Productivity' },
  { value: REPORT_TYPES.EXECUTIVE_SUMMARY, label: 'Executive Summary' },
]

function ReportsContent() {
  const { profile } = useSelector((state) => state.profile)
  const [typeFilter, setTypeFilter] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 10

  const { data, isLoading, error, refetch } = useReports({ page, pageSize, type: typeFilter || undefined })
  const [generateError, setGenerateError] = useState(null)
  const [phase, setPhase] = useState('idle')
  const generateMutation = useGenerateReport()
  const deleteMutation = useDeleteReport()

  const handleGenerate = async ({ type, title }) => {
    if (!type) return
    setGenerateError(null)
    setPhase('generating')
    try {
      await generateMutation.mutateAsync({ type, title })
      setPhase('idle')
    } catch (err) {
      setPhase('error')
      setGenerateError(err?.message || 'Failed to generate report')
    }
  }

  const handleDelete = async (reportId) => {
    if (window.confirm('Are you sure you want to delete this report?')) {
      await deleteMutation.mutateAsync(reportId)
    }
  }

  const handlePageChange = (newPage) => {
    setPage(newPage)
  }

  const reports = data?.reports || []
  const totalCount = data?.totalCount || 0
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Generate and manage AI-powered reports</p>
        </div>
      </div>

      {generateError && (
        <div className="flex items-center gap-2 p-3 text-sm text-red-700 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg">
          <AlertCircle size={16} className="flex-shrink-0" />
          <span className="flex-1">{generateError}</span>
          <button onClick={() => setGenerateError(null)} className="text-red-500 hover:text-red-700 font-bold">&times;</button>
        </div>
      )}

      <ReportGenerator
        onGenerate={handleGenerate}
        isGenerating={generateMutation.isPending}
        phase={phase}
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1) }}
            className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{totalCount} report(s)</p>
      </div>

      {isLoading ? (
        <ReportsSkeleton />
      ) : error ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-3" />
            <p className="text-red-500 mb-3">{error?.message || 'Failed to load reports'}</p>
            <button onClick={() => refetch()} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
              Retry
            </button>
          </div>
        </div>
      ) : reports.length === 0 ? (
        <ReportsEmptyState />
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              profile={profile}
              onDelete={handleDelete}
              isDeleting={deleteMutation.isPending}
            />
          ))}

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => handlePageChange(page - 1)}
                  className="px-3 py-1.5 text-sm rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => handlePageChange(page + 1)}
                  className="px-3 py-1.5 text-sm rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function ReportsPage() {
  return (
    <FeatureGate feature="reports">
      <ReportsContent />
    </FeatureGate>
  )
}
