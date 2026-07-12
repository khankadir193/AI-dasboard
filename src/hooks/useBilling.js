import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createOrder,
  verifyPayment,
  fetchBillingTransactions,
} from '../services/billingService'

export function useCreateOrder() {
  return useMutation({
    mutationFn: (companyId) => createOrder(companyId),
    retry: 1,
  })
}

export function useVerifyPayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload) => verifyPayment(payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['subscription', variables.companyId] })
    },
    retry: 1,
  })
}

export function useBillingTransactions(companyId) {
  return useQuery({
    queryKey: ['billingTransactions', companyId],
    queryFn: () => fetchBillingTransactions(companyId),
    enabled: !!companyId,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    retry: 1,
  })
}
