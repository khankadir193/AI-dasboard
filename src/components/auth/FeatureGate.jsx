import { useSelector } from 'react-redux'
import { NavLink } from 'react-router-dom'
import { useSubscription } from '../../services/subscriptionService'
import { hasFeatureAccess } from '../../utils/subscriptionAccess'

export default function FeatureGate({ feature, fallback, children }) {
  const { profile } = useSelector((state) => state.profile)
  const companyId = profile?.company_id

  const {
    data: subscription,
    isLoading,
    isFetching,
    isError,
  } = useSubscription(companyId)

  if (!companyId || isLoading || isFetching || isError) {
    return children
  }

  if (hasFeatureAccess(feature, subscription)) {
    return children
  }

  return fallback || <TrialExpiredUpgradeScreen />
}

function TrialExpiredUpgradeScreen() {
  return (
    <div className="card p-8 text-center max-w-xl mx-auto">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
        Trial Expired
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
        Your trial has expired. Upgrade to continue using premium features.
      </p>
      <NavLink
        to="/billing"
        className="btn-primary inline-flex items-center justify-center mt-5"
      >
        Upgrade Now
      </NavLink>
    </div>
  )
}

