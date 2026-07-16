import { supabase } from '../lib/supabaseClient'

export const FEATURE_FLAGS = {
  AI_INSIGHTS: 'ai_insights',
  EXPORT_CSV: 'export_csv',
  REALTIME_DASHBOARD: 'realtime_dashboard',
  TEAM_ANALYTICS: 'team_analytics',
  NOTIFICATIONS: 'notifications',
}

export async function getFeatureFlags(companyId) {
  if (!companyId) return []

  const { data, error } = await supabase
    .from('feature_flags')
    .select('feature_key, enabled')
    .eq('company_id', companyId)

  if (error) {
    console.error('[featureFlagService] getFeatureFlags error:', error)
    throw new Error('Failed to load feature flags')
  }

  console.log('[FeatureFlags] fetched for company', companyId, ':', data || [])
  return data || []
}

export async function setFeatureFlag(companyId, flagKey, enabled) {
  if (!companyId || !flagKey) throw new Error('companyId and flagKey are required')

  const { data, error } = await supabase
    .from('feature_flags')
    .upsert(
      { company_id: companyId, feature_key: flagKey, enabled },
      { onConflict: 'company_id, feature_key' }
    )
    .select()
    .maybeSingle()

  if (error) {
    console.error('[featureFlagService] setFeatureFlag error:', error)
    throw new Error('Failed to update feature flag')
  }

  return data
}

export async function setFeatureFlags(companyId, flags) {
  if (!companyId || !flags?.length) return []

  const rows = flags.map(({ flagKey, enabled }) => ({
    company_id: companyId,
    feature_key: flagKey,
    enabled: !!enabled,
  }))

  const { data, error } = await supabase
    .from('feature_flags')
    .upsert(rows, { onConflict: 'company_id, feature_key' })
    .select()

  if (error) {
    console.error('[featureFlagService] setFeatureFlags error:', error)
    throw new Error('Failed to update feature flags')
  }

  return data || []
}

export async function ensureFeatureFlags(companyId) {
  if (!companyId) return []

  const { data: existing, error: checkError } = await supabase
    .from('feature_flags')
    .select('id')
    .eq('company_id', companyId)

  if (checkError) {
    console.error('[featureFlagService] ensureFeatureFlags check error:', checkError)
    return []
  }

  if (existing && existing.length > 0) {
    return []
  }

  const defaultFlags = [
    { flagKey: 'ai_insights', enabled: true },
    { flagKey: 'analytics', enabled: true },
    { flagKey: 'activity_logs', enabled: true },
    { flagKey: 'notifications', enabled: true },
  ]

  console.log('[FeatureFlags] seeding defaults for company', companyId, ':', defaultFlags)
  return setFeatureFlags(companyId, defaultFlags)
}
