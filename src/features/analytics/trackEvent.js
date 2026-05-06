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
  'conversion_rate',
  'orders',
  'traffic',
  'engagement',
  'dashboard_view'
]

/**
 * Track an analytics event
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
  // Multi-tenant safety: skip if company_id is missing
  if (!companyId) {
    console.warn('[trackEvent] Missing companyId - skipping analytics insert')
    return
  }

  // Validate required fields
  if (!type || typeof type !== 'string') {
    console.error('[trackEvent] Invalid metric_type - skipping analytics insert')
    return
  }

  // Validate metric_type against allowed list
  if (!ALLOWED_TYPES.includes(type)) {
    console.error('[trackEvent] Invalid metric_type:', type, '- allowed types:', ALLOWED_TYPES)
    return
  }

  // Safety check: prevent fake/mock data insertion
  if (metadata?.isMock === true || metadata?.source === 'mock' || metadata?.source === 'sample') {
    console.warn('[trackEvent] Rejecting mock data insertion - metadata:', metadata)
    return
  }

  // Safety check: detect suspicious random values
  if (typeof value === 'number' && value > 10000 && !metadata?.isReal) {
    console.warn('[trackEvent] Suspiciously large value detected - may be random data:', value)
  }

  console.log('[trackEvent] Tracking event:', { companyId, type, value })

  try {
    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD

    const { error } = await supabase
      .from('analytics_data')
      .insert({
        company_id: companyId,
        metric_type: type,
        metric_value: value,
        metric_date: today,
        metadata: metadata
      })

    if (error) {
      console.error('[trackEvent] Analytics insert failed:', error.message)
      return
    }

    console.log('[trackEvent] Analytics inserted successfully')
  } catch (error) {
    // Handle errors - do NOT break UI
    console.error('[trackEvent] Unexpected error:', error.message)
  }
}
