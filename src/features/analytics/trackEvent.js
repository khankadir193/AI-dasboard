import { supabase } from '../../lib/supabaseClient'

// Allowed metric types - must match database constraint
const ALLOWED_TYPES = [
  'revenue',
  'expenses',
  'users',
  'active_users',
  'projects',
  'projects_created',
  'projects_deleted',
  'projects_updated',
  'conversion_rate',
  'orders',
  'traffic',
  'engagement',
  'dashboard_view'
]

// In-memory dedup to prevent duplicate event tracking within the redirect window
const recentEvents = new Map()
const DEDUP_WINDOW_MS = 2000
let cleanupInterval = null

function startCleanup() {
  if (cleanupInterval) return
  cleanupInterval = setInterval(() => {
    const now = Date.now()
    for (const [key, ts] of recentEvents) {
      if (now - ts > DEDUP_WINDOW_MS * 2) {
        recentEvents.delete(key)
      }
    }
    if (recentEvents.size === 0 && cleanupInterval) {
      clearInterval(cleanupInterval)
      cleanupInterval = null
    }
  }, DEDUP_WINDOW_MS * 2)
}

/**
 * Track an analytics event (production-safe, non-blocking)
 * 
 * @param {Object} params - Event parameters
 * @param {string} params.companyId - The company ID (required for multi-tenant safety)
 * @param {string} params.type - The metric type (e.g., 'projects_created', 'active_users')
 * @param {number} params.value - The metric value (default: 1)
 * @param {Object} params.metadata - Optional JSON metadata
 * 
 * @returns {Promise<void>}
 */
export async function trackEvent({ companyId, type, value = 1, metadata = {} }) {
  // Input validation
  if (!companyId || !type) {
    return
  }

  // Type validation
  if (!ALLOWED_TYPES.includes(type)) {
    return
  }

  // In-memory dedup: suppress rapid duplicates (same companyId + type within 2000ms)
  const dedupKey = `${companyId}:${type}`
  const now = Date.now()
  const lastEvent = recentEvents.get(dedupKey)
  if (lastEvent && (now - lastEvent) < DEDUP_WINDOW_MS) return
  recentEvents.set(dedupKey, now)
  startCleanup()

  // Non-blocking insert
  return supabase
    .from('analytics_data')
    .insert({
      company_id: companyId,
      metric_type: type,
      metric_value: value,
      metric_date: new Date().toISOString().split('T')[0],
      metadata
    })
    .then(({ error }) => {
      if (error) {
        console.error(`[trackEvent] FAILED: type="${type}" companyId="${companyId}" value=${value}`, error)
      }
    })
    .catch((err) => {
      console.error(`[trackEvent] UNEXPECTED ERROR: type="${type}" companyId="${companyId}"`, err)
    })
}
