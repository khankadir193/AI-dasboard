import { supabase } from '../lib/supabaseClient'

export const ACTIONS = {
  LOGIN: 'login',
  LOGOUT: 'logout',
  DASHBOARD_VIEW: 'dashboard_view',
  PROJECT_CREATE: 'project_create',
  PROJECT_UPDATE: 'project_update',
  PROJECT_DELETE: 'project_delete',
  INVITE_SEND: 'invite_send',
  INVITE_ACCEPT: 'invite_accept',
  ROLE_UPDATE: 'role_update',
  SETTINGS_CHANGE: 'settings_change',
}

export const RESOURCE_TYPES = {
  PROJECT: 'project',
  USER: 'user',
  INVITE: 'invite',
  SETTINGS: 'settings',
  DASHBOARD: 'dashboard',
  AUTH: 'auth',
}

const recentLogs = new Map()
const DEDUP_WINDOW_MS = 2000

let cleanupInterval = null

function startCleanup() {
  if (cleanupInterval) return
  cleanupInterval = setInterval(() => {
    const now = Date.now()
    for (const [key, ts] of recentLogs) {
      if (now - ts > DEDUP_WINDOW_MS * 2) {
        recentLogs.delete(key)
      }
    }
    if (recentLogs.size === 0 && cleanupInterval) {
      clearInterval(cleanupInterval)
      cleanupInterval = null
    }
  }, DEDUP_WINDOW_MS * 2)
}

function getDedupKey(params) {
  return `${params.companyId}:${params.action}:${params.resourceType}:${params.resourceId || ''}`
}

export async function logActivity({ companyId, userId, action, resourceType, resourceId, description, metadata = {} }) {
  if (!companyId || !action || !resourceType) {
    console.warn('[activityLog] Skipping log: missing required fields', { companyId, action, resourceType })
    return
  }

  const dedupKey = getDedupKey({ companyId, action, resourceType, resourceId })
  const now = Date.now()
  const lastLog = recentLogs.get(dedupKey)

  if (lastLog && (now - lastLog) < DEDUP_WINDOW_MS) return

  recentLogs.set(dedupKey, now)
  startCleanup()

  return supabase
    .from('activity_logs')
    .insert({
      company_id: companyId,
      user_id: userId || null,
      action,
      resource_type: resourceType,
      resource_id: resourceId || null,
      description: description || '',
      metadata,
    })
    .then(({ error }) => {
      if (error) {
        console.error(`[activityLog] FAILED: action="${action}" companyId="${companyId}"`, error)
      }
    })
    .catch((err) => {
      console.error(`[activityLog] UNEXPECTED ERROR: action="${action}"`, err)
    })
}

export async function fetchActivityLogs({ companyId, page = 1, pageSize = 20, action, resourceType, startDate, endDate, search }) {
  if (!companyId) return { logs: [], totalCount: 0, page: 1, pageSize }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  try {
    let query = supabase
      .from('activity_logs')
      .select('*', { count: 'exact' })
      .eq('company_id', companyId)

    if (action) query = query.eq('action', action)
    if (resourceType) query = query.eq('resource_type', resourceType)
    if (startDate) query = query.gte('created_at', startDate)
    if (endDate) query = query.lte('created_at', endDate)
    if (search && search.trim()) query = query.ilike('description', `%${search.trim()}%`)

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) throw error

    return {
      logs: data || [],
      totalCount: count || 0,
      page,
      pageSize,
    }
  } catch (error) {
    console.error('[activityLogService] fetchActivityLogs error:', error)
    throw new Error('Failed to fetch activity logs')
  }
}
