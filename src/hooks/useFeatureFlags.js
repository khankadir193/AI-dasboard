import { useQuery } from '@tanstack/react-query'
import { getFeatureFlags } from '../services/featureFlagService'

export function useFeatureFlags(companyId, currentPlan) {
  const { data: flags = [], isLoading, error } = useQuery({
    queryKey: ['featureFlags', companyId],
    queryFn: () => getFeatureFlags(companyId),
    enabled: !!companyId,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    retry: 1,
  })

  const flagMap = flags.reduce((acc, f) => {
    acc[f.feature_key] = f.enabled
    return acc
  }, {})

  const isEnabled = (flagKey) => {
    if (!flagKey) return false

    const found = flagKey in flagMap
    const enabled = flagMap[flagKey] === true

    if (!found && import.meta.env.DEV) {
      console.log(
        `[FeatureFlags] ${flagKey} not found in DB — defaulting to enabled in development`
      )
      return true
    }

    console.log(
      `[FeatureFlags] company=${companyId} flag=${flagKey} enabled=${enabled} plan=${currentPlan} access=${enabled ? 'granted' : 'denied'}`
    )

    return enabled
  }

  return { isEnabled, flags, isLoading, error }
}
