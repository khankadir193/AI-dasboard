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
  // Input validation
  if (!companyId || !type) {
    console.warn('[Analytics] Missing tracking params', { companyId, type })
    return
  }

  console.log('🔥 trackEvent CALLED:', { companyId, type, value })

  try {
    const today = new Date().toISOString().split('T')[0]

    const payload = {
      company_id: companyId,
      metric_type: type,
      metric_value: value,
      metric_date: today,
      metadata
    }

    console.log('📦 INSERT PAYLOAD:', payload)

    const { data, error } = await supabase
      .from('analytics_data')
      .insert(payload)
      .select()

    console.log('📡 SUPABASE RESPONSE:', { data, error })

    if (error) {
      // Handle duplicate conflict silently (error code 23505)
      if (error.code === '23505') {
        console.warn('[Analytics] Duplicate prevented:', type)
      } else {
        console.error('[Analytics FAILED]', error)
      }
    } else {
      console.log('[Analytics SUCCESS]', { type, companyId, value })
    }
  } catch (err) {
    console.error('[Analytics UNEXPECTED ERROR]', err)
  }
}
