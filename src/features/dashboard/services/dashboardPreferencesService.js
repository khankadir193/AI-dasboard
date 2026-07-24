import { supabase } from '../../../lib/supabaseClient'

// Default widget slot order for Dashboard.jsx
export const DEFAULT_WIDGET_ORDER = [
  'kpi_section',
  'charts_row',
  'event_distribution',
  'recent_activity_feed',
]

export const DEFAULT_HIDDEN_WIDGETS = []

/** Fetch dashboard preferences for the current company. */
export async function fetchDashboardPreferences(userId, companyId) {
  if (!userId || !companyId) return null // Wait until tenant context is available

  const { data, error } = await supabase
    .from('dashboard_preferences')
    .select('widget_order, hidden_widgets')
    .eq('user_id', userId)
    .eq('company_id', companyId)
    .maybeSingle()

  if (error) {
    console.error('[dashboardPreferences] fetchDashboardPreferences error:', error)
    return null // Fallback to default layout
  }

  return data || null
}

/** Save dashboard preferences for the current company. */
export async function upsertDashboardPreferences(userId, companyId, { widget_order, hidden_widgets }) {
  if (!userId) throw new Error('User ID is required')
  if (!companyId) throw new Error('Company ID is required — preferences cannot be saved without a tenant context')

  const { data, error } = await supabase
    .from('dashboard_preferences')
    .upsert(
      {
        user_id: userId,
        company_id: companyId,
        widget_order,
        hidden_widgets,
      },
      {
        onConflict: 'user_id,company_id',
      }
    )
    .select()
    .maybeSingle()

  if (error) throw error
  return data
}
