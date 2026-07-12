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

/**
 * Returns true if the subscription is in an active/usable state.
 * Pro/Enterprise with cancelled or expired status are considered inactive.
 */
export function isSubscriptionActive(subscription) {
  if (!subscription || typeof subscription !== 'object') return false
  const status = subscription.subscription_status
  return status === 'active'
}

export function hasFeatureAccess(featureKey, subscription, now = new Date()) {
  if (!featureKey) return false
  if (!subscription || typeof subscription !== 'object') return true

  const plan = subscription.subscription_plan
  const status = subscription.subscription_status

  // Pro and Enterprise: full access only when subscription is active
  if (plan === 'pro' || plan === 'enterprise') {
    if (status === 'active') return true
    // Cancelled or expired pro/enterprise: block gated features
    if (!GATED_FEATURES.has(featureKey)) return true
    return false
  }

  // Non-gated features are always accessible (data remains visible)
  if (!GATED_FEATURES.has(featureKey)) return true

  // Gated features on trial: block only when trial is expired
  if (plan === 'trial') return !isTrialExpired(subscription, now)

  // Unknown plan — deny access (safety fallback)
  return false
}

/**
 * Returns false when write actions should be blocked.
 * Blocks writes for: expired trial, cancelled pro, expired pro.
 * Allows writes for: active trial, active pro, active enterprise.
 */
export function canPerformWriteAction(subscription) {
  if (!subscription || typeof subscription !== 'object') return true
  const plan = subscription.subscription_plan
  const status = subscription.subscription_status

  if (plan === 'pro' || plan === 'enterprise') return status === 'active'
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

