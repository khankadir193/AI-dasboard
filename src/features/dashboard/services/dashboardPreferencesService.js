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
 * Scoped by BOTH user_id AND company_id so that:
 *   - A user in multiple companies gets independent layouts per company.
 *   - An admin switching company context doesn't see another company's layout.
 *
 * Returns null (not an error) when no row exists yet.
 * The caller (useDashboardPreferences) will display the default layout.
 * The row is only created when the user explicitly saves for the first time —
 * this keeps the database clean for users who never customise their dashboard.
 *
 * @param {string} userId    - auth.users.id
 * @param {string} companyId - profiles.company_id
 * @returns {Promise<{ widget_order: string[], hidden_widgets: string[] } | null>}
 */
export async function fetchDashboardPreferences(userId, companyId) {
  // Both are required — we never fetch without a full tenant context.
  if (!userId || !companyId) return null

  const { data, error } = await supabase
    .from('dashboard_preferences')
    .select('widget_order, hidden_widgets')
    .eq('user_id', userId)
    .eq('company_id', companyId)
    .maybeSingle()

  if (error) {
    console.error('[dashboardPreferences] fetchDashboardPreferences error:', error)
    return null // Non-fatal — dashboard falls back to default order
  }

  return data || null
}

/**
 * Saves (upserts) the user's dashboard preferences.
 *
 * Uses ON CONFLICT on the composite (user_id, company_id) unique index
 * to handle first-save and subsequent updates without race conditions.
 *
 * Requires companyId — we never write a preferences row without full tenant
 * context. This ensures multi-tenant isolation is enforced at the write path.
 *
 * @param {string} userId    - auth.users.id
 * @param {string} companyId - profiles.company_id  (required)
 * @param {{ widget_order: string[], hidden_widgets: string[] }} prefs
 * @returns {Promise<Object>}
 */
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
        // updated_at is handled by the DB trigger; no need to set it client-side
      },
      {
        // Composite unique index (user_id, company_id) — added in migration
        // 20260723_dashboard_preferences_org_scope.sql.
        // This is ALWAYS used (companyId is required above), so there is no
        // conditional branch here. Eliminates the old bug where a null companyId
        // caused onConflict: 'user_id' to be used after the constraint was dropped.
        onConflict: 'user_id,company_id',
      }
    )
    .select()
    .maybeSingle()

  if (error) throw error
  return data
}
