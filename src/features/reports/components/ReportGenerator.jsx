import { useState } from 'react'
import { FileText, Loader2, Sparkles } from 'lucide-react'
import { REPORT_TYPES } from '../api/reportsService'

const REPORT_TYPE_OPTIONS = [
  { value: REPORT_TYPES.WEEKLY, label: 'Weekly Report', desc: 'Last 7 days of activity and metrics' },
  { value: REPORT_TYPES.MONTHLY, label: 'Monthly Report', desc: 'Full month analysis with trends' },
  { value: REPORT_TYPES.TEAM_PRODUCTIVITY, label: 'Team Productivity', desc: 'Team activity over 14 days' },
  { value: REPORT_TYPES.EXECUTIVE_SUMMARY, label: 'Executive Summary', desc: 'High-level overview for leadership' },
]

export default function ReportGenerator({ onGenerate, isGenerating }) {
  const [selectedType, setSelectedType] = useState(REPORT_TYPES.WEEKLY)
  const [customTitle, setCustomTitle] = useState('')

  const handleGenerate = (e) => {
    e.preventDefault()
    if (!selectedType || isGenerating) return
    onGenerate({ type: selectedType, title: customTitle.trim() || undefined })
    setCustomTitle('')
  }

  return (
    <div className="card p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <Sparkles size={20} className="text-white" />
        </div>
        <div>
          <h2 className="font-semibold text-gray-900 dark:text-white">Generate AI Report</h2>
          <p className="text-xs text-gray-500">Create a report using your workspace data</p>
        </div>
      </div>

      <form onSubmit={handleGenerate} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {REPORT_TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setSelectedType(opt.value)}
              className={`text-left p-3 rounded-xl border transition-all ${
                selectedType === opt.value
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 dark:border-blue-600'
                  : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
              }`}
            >
              <p className="text-sm font-medium text-gray-900 dark:text-white">{opt.label}</p>
              <p className="text-xs text-gray-500 mt-1">{opt.desc}</p>
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
          <div className="flex-1 w-full">
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Custom Title (optional)
            </label>
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder="e.g., Q2 Executive Review"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={isGenerating}
            className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors text-sm font-medium"
          >
            {isGenerating ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileText size={16} />
                Generate Report
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
