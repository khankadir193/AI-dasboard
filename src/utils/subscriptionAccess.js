const FULL_ACCESS_PLANS = new Set(['trial', 'pro', 'enterprise'])

export const GATED_FEATURES = new Set([
  'dashboard',
  'analytics',
  'projects',
  'team_management',
  'activity_logs',
  'notifications',
  'audit_trail',
  'ai_insights',
])

export function isTrialExpired(subscription, now = new Date()) {
  if (!subscription || typeof subscription !== 'object') return false

  const plan = subscription.subscription_plan
  const status = subscription.subscription_status

  if (plan !== 'trial') return false
  if (status === 'expired') return true
  if (status !== 'active') return false
  if (!subscription.trial_ends_at) return false

  const trialEnd = new Date(subscription.trial_ends_at)
  if (Number.isNaN(trialEnd.getTime())) return false

  return now.getTime() >= trialEnd.getTime()
}

export function hasFeatureAccess(featureKey, subscription, now = new Date()) {
  if (!featureKey) return false
  if (!subscription || typeof subscription !== 'object') return true

  const plan = subscription.subscription_plan

  if (plan === 'pro' || plan === 'enterprise') return true
  if (plan === 'trial') return !isTrialExpired(subscription, now)
  if (!GATED_FEATURES.has(featureKey)) return true

  return !FULL_ACCESS_PLANS.has(plan)
}

export function getTrialDaysRemaining(subscription, now = new Date()) {
  if (!subscription?.trial_ends_at) return null

  const trialEnd = new Date(subscription.trial_ends_at)
  if (Number.isNaN(trialEnd.getTime())) return null

  const diffMs = trialEnd.getTime() - now.getTime()
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))
}

