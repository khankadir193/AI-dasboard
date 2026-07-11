import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'

export async function fetchSubscriptionFromDb(companyId) {
  if (!companyId) return null

  const { data, error } = await supabase
    .from('companies')
    .select('id, name, subscription_plan, trial_started_at, trial_ends_at, subscription_status')
    .eq('id', companyId)
    .maybeSingle()

  if (error) {
    console.error('[subscriptionService] fetch error:', error)
    return null
  }

  return data
}

export function useSubscription(companyId) {
  return useQuery({
    queryKey: ['subscription', companyId],
    queryFn: () => fetchSubscriptionFromDb(companyId),
    enabled: !!companyId,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    retry: 1,
  })
}
