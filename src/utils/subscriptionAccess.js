const FULL_ACCESS_PLANS = new Set(['trial', 'pro', 'enterprise'])

// Features that are completely blocked (show upgrade screen) when trial expires.
// Pages not in this set always remain accessible (with read-only mutations if trial expired).
export const GATED_FEATURES = new Set([
  'ai_insights',
  'notifications',
  'audit_trail',
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

  // Pro and Enterprise always have access to everything
  if (plan === 'pro' || plan === 'enterprise') return true

  // Non-gated features are always accessible (data remains visible)
  if (!GATED_FEATURES.has(featureKey)) return true

  // Gated features on trial: block only when trial is expired
  if (plan === 'trial') return !isTrialExpired(subscription, now)

  // Unknown plan — deny access (safety fallback)
  return false
}

/**
 * Returns false when trial has expired, preventing write/mutation actions.
 * Returns true for pro, enterprise, active trial, or any edge case (safe fallback).
 */
export function canPerformWriteAction(subscription) {
  if (!subscription || typeof subscription !== 'object') return true
  const plan = subscription.subscription_plan
  if (plan === 'pro' || plan === 'enterprise') return true
  if (plan === 'trial') return !isTrialExpired(subscription)
  return true
}

export function getTrialDaysRemaining(subscription, now = new Date()) {
  if (!subscription?.trial_ends_at) return null

  const trialEnd = new Date(subscription.trial_ends_at)
  if (Number.isNaN(trialEnd.getTime())) return null

  const diffMs = trialEnd.getTime() - now.getTime()
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))
}

