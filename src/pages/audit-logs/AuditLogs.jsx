import { useState } from 'react'
import { useSelector } from 'react-redux'
import { Loader2, ScrollText, RefreshCw, Search, Filter } from 'lucide-react'
import { useActivityLogs } from '../../hooks/useActivityLogs'
import { ACTIONS } from '../../services/activityLogService'
import FeatureGate from '../../components/auth/FeatureGate'

const ACTION_LABELS = {
  // Auth events removed from activity_logs per spec — login/logout are session events.
  // Rows written before this change will fall back to the raw action string via ACTION_LABELS[action] || action.
  // Business actions:
  [ACTIONS.PROJECT_CREATE]: 'Project Created',
  [ACTIONS.PROJECT_UPDATE]: 'Project Updated',
  [ACTIONS.PROJECT_DELETE]: 'Project Deleted',
  [ACTIONS.INVITE_SEND]: 'Invite Sent',
  [ACTIONS.INVITE_ACCEPT]: 'Invite Accepted',
  [ACTIONS.ROLE_UPDATE]: 'Role Updated',
  [ACTIONS.SETTINGS_CHANGE]: 'Settings Changed',
  [ACTIONS.REPORT_GENERATE]: 'Report Generated',
  [ACTIONS.AI_INSIGHT]: 'AI Insight Generated',
  [ACTIONS.MEMBER_ADD]: 'Member Added',
  [ACTIONS.MEMBER_REMOVE]: 'Member Removed',
}

const ACTION_COLORS = {
  [ACTIONS.PROJECT_CREATE]: 'text-green-600 dark:text-green-400',
  [ACTIONS.PROJECT_UPDATE]: 'text-orange-600 dark:text-orange-400',
  [ACTIONS.PROJECT_DELETE]: 'text-red-600 dark:text-red-400',
  [ACTIONS.INVITE_SEND]: 'text-blue-600 dark:text-blue-400',
  [ACTIONS.INVITE_ACCEPT]: 'text-teal-600 dark:text-teal-400',
  [ACTIONS.ROLE_UPDATE]: 'text-yellow-600 dark:text-yellow-400',
  [ACTIONS.SETTINGS_CHANGE]: 'text-indigo-600 dark:text-indigo-400',
  [ACTIONS.REPORT_GENERATE]: 'text-purple-600 dark:text-purple-400',
  [ACTIONS.AI_INSIGHT]: 'text-violet-600 dark:text-violet-400',
  [ACTIONS.MEMBER_ADD]: 'text-emerald-600 dark:text-emerald-400',
  [ACTIONS.MEMBER_REMOVE]: 'text-rose-600 dark:text-rose-400',
}

function AuditLogsContent() {
  const { profile } = useSelector((state) => state.profile)
  const companyId = profile?.company_id

  const [page, setPage] = useState(1)
  const [actionFilter, setActionFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const pageSize = 20

  const { data, isLoading, error, refetch } = useActivityLogs({
    companyId,
    page,
    pageSize,
    action: actionFilter || undefined,
    search: searchQuery || undefined,
  })

  const logs = data?.logs || []
  const totalCount = data?.totalCount || 0
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

  const timeAgo = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return ''
    const now = Date.now()
    const diffMs = Math.max(0, now - date.getTime())
    const mins = Math.floor(diffMs / 60000)
    const hours = Math.floor(mins / 60)
    const days = Math.floor(hours / 24)
    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    if (mins > 0) return `${mins} min ago`
    return 'just now'
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Audit Trail</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Chronological record of all important actions in your workspace.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search logs..."
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setPage(1) }}
            className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 outline-none focus:border-blue-400 dark:focus:border-blue-600 transition-colors"
          />
        </div>
        <div className="relative">
          <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <select
            value={actionFilter}
            onChange={e => { setActionFilter(e.target.value); setPage(1) }}
            className="pl-9 pr-8 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 outline-none focus:border-blue-400 dark:focus:border-blue-600 transition-colors appearance-none"
          >
            <option value="">All Actions</option>
            {Object.entries(ACTION_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
        </div>
      )}

      {/* Error state */}
      {!isLoading && error && (
        <div className="card p-6 text-center">
          <p className="text-red-500 mb-3">{error?.message || 'Failed to load audit logs'}</p>
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw size={16} />
            Retry
          </button>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && logs.length === 0 && (
        <div className="card p-12 text-center">
          <div className="flex flex-col items-center">
            <ScrollText size={48} className="text-gray-300 dark:text-gray-600 mb-4" />
            <p className="font-medium text-gray-900 dark:text-white">No audit logs found</p>
            <p className="text-sm mt-2 text-gray-500 dark:text-gray-400">
              {searchQuery || actionFilter
                ? 'Try adjusting your search or filters.'
                : 'Audit logs will appear here as you use the app.'}
            </p>
          </div>
        </div>
      )}

      {/* Logs table */}
      {!isLoading && !error && logs.length > 0 && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
                  <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Action</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Description</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Resource</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className={`px-4 py-3 text-sm font-medium whitespace-nowrap ${ACTION_COLORS[log.action] || ''}`}>
                      {ACTION_LABELS[log.action] || log.action}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {log.description}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {log.resource_type}
                      {log.resource_id && (
                        <span className="ml-1 font-mono text-xs text-gray-400 dark:text-gray-500">
                          #{log.resource_id.slice(0, 8)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-right whitespace-nowrap">
                      {timeAgo(log.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-800">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Page {page} of {totalPages} ({totalCount} total)
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

export default function AuditLogs() {
  return (
    <FeatureGate feature="audit_trail">
      <AuditLogsContent />
    </FeatureGate>
  )
}
