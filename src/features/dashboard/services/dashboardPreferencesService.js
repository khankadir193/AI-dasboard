import { supabase } from '../../../lib/supabaseClient'

/**
 * Default widget slot order for Dashboard.jsx.
 * 'charts_row' is a compound slot containing ActivityTimelineChart + ProjectStatusChart
 * (they share a grid wrapper; treated as a single orderable unit).
 *
 * Individual widget IDs used in hidden_widgets:
 *   'kpi_section' | 'activity_timeline' | 'project_status' |
 *   'event_distribution' | 'recent_activity_feed'
 */
export const DEFAULT_WIDGET_ORDER = [
  'kpi_section',
  'charts_row',
  'event_distribution',
  'recent_activity_feed',
]

export const DEFAULT_HIDDEN_WIDGETS = []

/**
 * Fetches the user's saved dashboard preferences.
 * Returns null (not an error) when no row exists yet — existing users
 * will see the default dashboard layout unchanged.
 *
 * @param {string} userId - auth.users.id
 * @returns {Promise<{ widget_order: string[], hidden_widgets: string[] } | null>}
 */
export async function fetchDashboardPreferences(userId) {
  if (!userId) return null

  const { data, error } = await supabase
    .from('dashboard_preferences')
    .select('widget_order, hidden_widgets')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    console.error('[dashboardPreferences] fetchDashboardPreferences error:', error)
    return null // Non-fatal — dashboard falls back to default order
  }

  return data || null
}

/**
 * Saves (upserts) the user's dashboard preferences.
 * Uses ON CONFLICT (user_id) to handle first-save and subsequent updates
 * without race conditions.
 *
 * @param {string} userId - auth.users.id
 * @param {{ widget_order: string[], hidden_widgets: string[] }} prefs
 * @returns {Promise<Object>}
 */
export async function upsertDashboardPreferences(userId, { widget_order, hidden_widgets }) {
  if (!userId) throw new Error('User ID is required')

  const { data, error } = await supabase
    .from('dashboard_preferences')
    .upsert(
      { user_id: userId, widget_order, hidden_widgets },
      { onConflict: 'user_id' }
    )
    .select()
    .maybeSingle()

  if (error) throw error
  return data
}
