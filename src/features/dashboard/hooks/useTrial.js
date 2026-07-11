import { useSelector } from 'react-redux'
import { useSubscription } from '../../../services/subscriptionService'
import { getTrialDaysRemaining, isTrialExpired } from '../../../utils/subscriptionAccess'

export const useTrial = () => {
  const { profile } = useSelector((state) => state.profile)
  const companyId = profile?.company_id

  const { data: subscription, isLoading, isFetching } = useSubscription(companyId)

  if (!companyId || isLoading || isFetching || subscription?.subscription_plan !== 'trial') {
    return {
      trialInfo: {
        isLoading: Boolean(companyId && (isLoading || isFetching)),
        trialEnd: null,
        daysLeft: null,
        isExpired: false,
      },
    }
  }

  const trialEnd = subscription?.trial_ends_at ? new Date(subscription.trial_ends_at) : null

  return {
    trialInfo: {
      isLoading: false,
      trialEnd: trialEnd && !Number.isNaN(trialEnd.getTime()) ? trialEnd : null,
      daysLeft: getTrialDaysRemaining(subscription),
      isExpired: isTrialExpired(subscription),
    },
  }
}

