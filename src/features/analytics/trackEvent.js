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
