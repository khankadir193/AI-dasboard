import { supabase } from '../../../lib/supabaseClient'

const NOTIFICATION_TYPES = {
  PROJECT_CREATED: 'project_created',
  PROJECT_UPDATED: 'project_updated',
  PROJECT_DELETED: 'project_deleted',
  PROJECT_DEADLINE: 'project_deadline_approaching',
  USER_INVITED: 'user_invited',
  USER_JOINED: 'user_joined',
  HIGH_PRODUCTIVITY: 'high_productivity',
  LOW_PRODUCTIVITY: 'low_productivity',
  ANALYTICS_ALERT: 'analytics_alert',
}

const PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
}

const RECENT_KEYS = new Map()
const DEDUP_WINDOW_MS = 3000
let cleanupTimer = null

function startCleanup() {
  if (cleanupTimer) return
  cleanupTimer = setInterval(() => {
    const now = Date.now()
    for (const [key, ts] of RECENT_KEYS) {
      if (now - ts > DEDUP_WINDOW_MS * 2) {
        RECENT_KEYS.delete(key)
      }
    }
    if (RECENT_KEYS.size === 0 && cleanupTimer) {
      clearInterval(cleanupTimer)
      cleanupTimer = null
    }
  }, DEDUP_WINDOW_MS * 2)
}

function getDedupKey(params) {
  return `${params.companyId}:${params.type}:${params.resourceId || ''}:${params.title}`
}

export async function createNotification({ companyId, userId, type, title, message, priority = PRIORITIES.MEDIUM, resourceType, resourceId, metadata = {} }) {
  if (!companyId || !type || !title) {
    console.warn('[notificationsService] Skipping: missing required fields', { companyId, type, title })
    return null
  }

  const dedupKey = getDedupKey({ companyId, type, resourceId, title })
  const now = Date.now()
  const lastTs = RECENT_KEYS.get(dedupKey)
  if (lastTs && (now - lastTs) < DEDUP_WINDOW_MS) return null
  RECENT_KEYS.set(dedupKey, now)
  startCleanup()

  const { data, error } = await supabase
    .from('notifications')
    .insert({
      company_id: companyId,
      user_id: userId || null,
      type,
      title,
      message,
      priority,
      resource_type: resourceType || null,
      resource_id: resourceId || null,
      metadata,
    })
    .select()
    .maybeSingle()

  if (error) {
    console.error('[notificationsService] createNotification error:', error)
    return null
  }

  return data
}

export async function fetchNotifications({ companyId, page = 1, pageSize = 20, type, priority, isRead, startDate, endDate }) {
  if (!companyId) return { notifications: [], totalCount: 0, page: 1, pageSize }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  try {
    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('company_id', companyId)

    if (type) query = query.eq('type', type)
    if (priority) query = query.eq('priority', priority)
    if (isRead !== undefined && isRead !== null) query = query.eq('is_read', isRead)
    if (startDate) query = query.gte('created_at', startDate)
    if (endDate) query = query.lte('created_at', endDate)

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) throw error

    return {
      notifications: data || [],
      totalCount: count || 0,
      page,
      pageSize,
    }
  } catch (error) {
    console.error('[notificationsService] fetchNotifications error:', error)
    throw new Error('Failed to fetch notifications')
  }
}

export async function markAsRead(notificationId) {
  if (!notificationId) throw new Error('Notification ID is required')

  const { data, error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .select()
    .maybeSingle()

  if (error) {
    console.error('[notificationsService] markAsRead error:', error)
    throw new Error('Failed to mark notification as read')
  }

  return data
}

export async function markAllAsRead(companyId, userId) {
  if (!companyId) throw new Error('Company ID is required')

  const { data, error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('company_id', companyId)
    .eq('is_read', false)
    .select()

  if (error) {
    console.error('[notificationsService] markAllAsRead error:', error)
    throw new Error('Failed to mark all notifications as read')
  }

  return data || []
}

export async function getUnreadCount(companyId) {
  if (!companyId) return 0

  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('is_read', false)

    if (error) throw error
    return count || 0
  } catch (error) {
    console.error('[notificationsService] getUnreadCount error:', error)
    return 0
  }
}

export { NOTIFICATION_TYPES, PRIORITIES }
