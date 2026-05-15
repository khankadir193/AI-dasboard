import { useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { supabase } from '../../lib/supabaseClient'
import EmptyState from '../../components/common/EmptyState'
import Spinner from '../../components/ui/Spinner'
import { Card } from '../../components/ui/Card'
import { Badge, Button, Input } from '../../components/ui'
import { Bell, Clock, CheckCircle2, Dot, Filter, Search, User } from 'lucide-react'

const EVENT_DEFS = {
  projects_created: {
    label: 'New project created',
    badgeVariant: 'success'
  },
  projects_updated: {
    label: 'Project updated',
    badgeVariant: 'primary'
  },
  projects_deleted: {
    label: 'Project deleted',
    badgeVariant: 'danger'
  },
  dashboard_view: {
    label: 'Dashboard activity alert',
    badgeVariant: 'outline'
  },
  active_users: {
    label: 'User login',
    badgeVariant: 'secondary'
  }
}

const DEFAULT_FILTER = 'all'

function safeLower(v) {
  return (v ?? '').toString().toLowerCase()
}

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

function getNotificationId(ev, idx) {
  return `${ev.id ?? ev.created_at ?? ev.metric_type}-${ev.metric_date ?? ''}-${idx}`
}

export default function Notifications() {
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

  const tenantKey = useMemo(() => (companyId ? `tenant_${companyId}` : 'tenant_unknown'), [companyId])
  const readStorageKey = useMemo(() => `notifications_read_${tenantKey}`, [tenantKey])

  const [readIds, setReadIds] = useState(() => new Set())

  useEffect(() => {
    // hydrate read state
    try {
      const raw = localStorage.getItem(readStorageKey)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          setReadIds(new Set(parsed))
        }
      }
    } catch {
      // ignore
    }
  }, [readStorageKey])

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
        const { data, error: fetchError } = await supabase
          .from('analytics_data')
          .select('*')
          .eq('company_id', companyId)
          .in('metric_type', allowedTypes)
          .order('created_at', { ascending: false })

        if (fetchError) throw fetchError
        if (!cancelled) {
          setEvents(Array.isArray(data) ? data : [])
          setLoading(false)
        }
      } catch (e) {
        if (!cancelled) {
          setError(e?.message || 'Failed to load notifications')
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

    return (events || [])
      .filter((ev) => {
        if (typeFilter === DEFAULT_FILTER) return true
        return ev.metric_type === typeFilter
      })
      .filter((ev, idx) => {
        if (!q) return true
        const def = EVENT_DEFS[ev.metric_type]
        const label = def?.label || ev.metric_type
        const userStr = safeLower(
          ev?.metadata?.email ||
            ev?.metadata?.user ||
            ev?.metadata?.username ||
            ev?.metadata?.displayName ||
            ''
        )
        const createdAt = formatDateTime(ev.created_at || ev.metric_date)
        return safeLower(label).includes(q) || userStr.includes(q) || safeLower(createdAt).includes(q)
      })
  }, [events, query, typeFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, page, pageSize])

  useEffect(() => {
    setPage(1)
  }, [query, typeFilter])

  const markAsRead = (notificationId) => {
    setReadIds((prev) => {
      const next = new Set(prev)
      next.add(notificationId)
      try {
        localStorage.setItem(readStorageKey, JSON.stringify(Array.from(next)))
      } catch {
        // ignore
      }
      return next
    })
  }

  const unreadCount = useMemo(() => {
    const allowed = events || []
    let count = 0
    for (let i = 0; i < allowed.length; i++) {
      const id = getNotificationId(allowed[i], i)
      if (!readIds.has(id)) count += 1
    }
    return count
  }, [events, readIds])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Notifications</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Important alerts from your workspace.</p>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
          <span className="inline-flex items-center gap-2">
            <Bell size={16} />
            {unreadCount} unread
          </span>
        </div>
      </div>

      <Card padding="md" shadow="none" className="p-4">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-900 rounded-xl px-3 py-2">
              <Search size={16} className="text-gray-400" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search notifications..."
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
              <option value="all">All notification types</option>
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
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {loading ? (
            <div className="px-4 py-12">
              <div className="flex items-center justify-center gap-3 text-gray-500 dark:text-gray-400">
                <Spinner />
                Loading notifications...
              </div>
            </div>
          ) : error ? (
            <div className="px-4 py-12">
              <div className="text-center text-red-600 dark:text-red-400">{error}</div>
            </div>
          ) : paged.length === 0 ? (
            <div className="px-4 py-12">
              <EmptyState icon={Bell} title="No notifications" description="Try adjusting your search or filters." />
            </div>
          ) : (
            paged.map((ev, idx) => {
              const def = EVENT_DEFS[ev.metric_type] || { label: ev.metric_type, badgeVariant: 'default' }
              const userName =
                ev?.metadata?.email ||
                ev?.metadata?.user ||
                ev?.metadata?.username ||
                ev?.metadata?.displayName ||
                'Workspace user'

              const notificationId = getNotificationId(ev, idx + (page - 1) * pageSize)
              const isRead = readIds.has(notificationId)

              return (
                <button
                  key={notificationId}
                  type="button"
                  onClick={() => markAsRead(notificationId)}
                  className={
                    'w-full text-left px-4 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors flex items-start gap-3'
                  }
                >
                  <div className="pt-1">
                    {isRead ? (
                      <CheckCircle2 className="text-green-600 dark:text-green-400" size={18} />
                    ) : (
                      <span className="inline-flex items-center justify-center w-2.5 h-2.5 rounded-full bg-red-500 mt-1" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={def.badgeVariant} size="sm">{def.label}</Badge>
                      {!isRead && (
                        <Badge variant="outline" size="sm">
                          New
                        </Badge>
                      )}
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                      <span className="inline-flex items-center gap-1">
                        <User size={14} className="text-gray-400 dark:text-gray-500" />
                        {userName}
                      </span>
                      <span className="text-gray-400 dark:text-gray-500">•</span>
                      <span className="inline-flex items-center gap-1 text-gray-500 dark:text-gray-400">
                        <Clock size={14} />
                        {formatDateTime(ev.created_at || ev.metric_date)}
                      </span>
                    </div>
                  </div>

                  <div className="flex-shrink-0">
                    {!isRead && (
                      <span className="inline-flex items-center gap-1 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-full">
                        <Dot size={14} />
                        Unread
                      </span>
                    )}
                  </div>
                </button>
              )
            })
          )}
        </div>

        {!loading && !error && filtered.length > 0 && (
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
    </div>
  )
}

