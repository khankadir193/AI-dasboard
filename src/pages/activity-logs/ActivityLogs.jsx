import { useEffect, useMemo, useState } from 'react'
import { analyticsService } from '../../services/analyticsService'
import { Button } from '../../components/ui'
import { Input } from '../../components/ui'
import { Badge } from '../../components/ui'
import EmptyState from '../../components/common/EmptyState'
import Spinner from '../../components/ui/Spinner'
import { CHART_COLORS } from '../../lib/constants'
import { Card } from '../../components/ui/Card'
import { ROUTES } from '../../lib/constants'
import clsx from 'clsx'
import { Clock, Filter, Search, User } from 'lucide-react'
import { useSelector } from 'react-redux'
import FeatureGate from '../../components/auth/FeatureGate'

const EVENT_DEFS = {
  projects_created: {
    label: 'Project created',
    badgeVariant: 'success',
    badgeText: 'green'
  },
  projects_updated: {
    label: 'Project updated',
    badgeVariant: 'primary',
    badgeText: 'blue'
  },
  projects_deleted: {
    label: 'Project deleted',
    badgeVariant: 'danger',
    badgeText: 'red'
  },
  dashboard_view: {
    label: 'Dashboard viewed',
    badgeVariant: 'slate',
    badgeText: 'slate'
  },
  active_users: {
    label: 'User login',
    badgeVariant: 'purple',
    badgeText: 'purple'
  }
}


const DEFAULT_FILTER = 'all'

function formatDateTime(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString([], {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function safeLower(s) {
  return (s ?? '').toString().toLowerCase()
}

function ActivityLogsContent() {
  const { user } = useSelector((state) => state.auth)
  const { profile } = useSelector((state) => state.profile)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [events, setEvents] = useState([])

  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState(DEFAULT_FILTER)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)

  const companyId = profile?.company_id

  useEffect(() => {
    let cancelled = false

    const fetchEvents = async () => {
      try {
        if (!user?.id || !companyId) {
          setEvents([])
          setLoading(false)
          return
        }

        setLoading(true)
        setError(null)

        const allowedTypes = Object.keys(EVENT_DEFS)
        analyticsService.setCompanyId(companyId)
        const data = await analyticsService.fetchEventsByTypes(allowedTypes)

        if (!cancelled) {
          setEvents(Array.isArray(data) ? data : [])
          setLoading(false)
        }
      } catch (e) {
        if (!cancelled) {
          setError(e?.message || 'Failed to load activity logs')
          setEvents([])
          setLoading(false)
        }
      }
    }

    fetchEvents()
    return () => {
      cancelled = true
    }
  }, [companyId, user?.id])

  const filtered = useMemo(() => {
    const q = safeLower(query).trim()

    const getEventType = (ev) => {
      // Keep backwards compatibility with whatever analytics payload exists.
      return ev?.metric_type || ev?.metric_key || ev?.type || ''
    }

    return (events || [])
      .filter((ev) => {
        if (typeFilter === DEFAULT_FILTER) return true
        return getEventType(ev) === typeFilter
      })
      .filter((ev) => {
        if (!q) return true
        const eventType = getEventType(ev)
        const label = EVENT_DEFS[eventType]?.label || eventType
        const userStr = safeLower(
          ev?.metadata?.email ||
            ev?.metadata?.user ||
            ev?.metadata?.username ||
            ev?.metadata?.displayName ||
            ''
        )

        // Optional: include lightweight keyword search from metadata values (without deep refactors)
        const metadataText = safeLower(JSON.stringify(ev?.metadata || {}))
        return safeLower(label).includes(q) || userStr.includes(q) || metadataText.includes(q)
      })
  }, [events, query, typeFilter])


  const totalCount = filtered.length
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, page, pageSize])

  useEffect(() => {
    setPage(1)
  }, [query, typeFilter])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Activity Logs</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Track important workspace and user activities.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <span className="inline-flex items-center gap-2">
            <Filter size={16} />
            {totalCount} event{totalCount === 1 ? '' : 's'}
          </span>
        </div>
      </div>

      {/* Controls */}
      <Card padding="md" shadow="none" className="p-4">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-900 rounded-xl px-3 py-2">
              <Search size={16} className="text-gray-400" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search events..."
                className="border-0 bg-transparent p-0 focus:ring-0"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All event types</option>
              {Object.entries(EVENT_DEFS).map(([key, def]) => (
                <option key={key} value={key}>
                  {def.label}
                </option>
              ))}
            </select>
            <Button
              variant="ghost"
              onClick={() => {
                setQuery('')
                setTypeFilter(DEFAULT_FILTER)
              }}
              className="hidden sm:inline-flex"
            >
              Clear
            </Button>
          </div>
        </div>
      </Card>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto min-h-[420px]">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900/30">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Event</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">User</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Date / time</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={3} className="px-4 py-12">
                    <div className="flex items-center justify-center gap-3 text-gray-500 dark:text-gray-400">
                      <Spinner />
                      Loading activity logs...
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={3} className="px-4 py-12">
                    <div className="text-center text-red-600 dark:text-red-400">{error}</div>
                  </td>
                </tr>
              ) : paged.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-12">
                    <EmptyState
                      icon={Clock}
                      title="No activity found"
                      description="Try adjusting your search or filters."
                    />
                  </td>
                </tr>
              ) : (
                paged.map((ev, idx) => {
                  const def = EVENT_DEFS[ev.metric_type] || {}
                  const badgeVariant = def.badgeVariant || 'default'

                  const userName =
                    ev?.metadata?.email ||
                    ev?.metadata?.user ||
                    ev?.metadata?.username ||
                    ev?.metadata?.displayName ||
                    'Workspace user'

                  return (
                    <tr
                      key={`${ev.id ?? ev.created_at ?? ev.metric_type}-${idx}`}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                    >
                      <td className="px-4 py-3">

                        <div className="flex items-center gap-3">
                          <Badge variant={badgeVariant} size="sm">
                            {def.label || ev.metric_type}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                          <User size={16} className="text-gray-400 dark:text-gray-400" />
                          <span className="truncate max-w-[240px]">{userName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                        {formatDateTime(ev.created_at || ev.metric_date)}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && !error && totalCount > 0 && (
          <div className="px-4 py-4 flex items-center justify-between gap-3 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-300">
              Page <span className="font-medium text-gray-900 dark:text-white">{page}</span> of{' '}
              <span className="font-medium text-gray-900 dark:text-white">{totalPages}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Legend (small, enterprise-safe) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 text-xs text-gray-500 dark:text-gray-400">
        {Object.entries(EVENT_DEFS).map(([key, def]) => (
          <div key={key} className="flex items-center gap-2">
            <span className="inline-flex">
              <Badge variant={def.badgeVariant} size="sm">{def.label}</Badge>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ActivityLogs() {
  return (
    <FeatureGate feature="activity_logs">
      <ActivityLogsContent />
    </FeatureGate>
  )
}

