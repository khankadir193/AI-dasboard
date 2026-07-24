import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import {
  fetchDashboardPreferences,
  upsertDashboardPreferences,
  DEFAULT_WIDGET_ORDER,
  DEFAULT_HIDDEN_WIDGETS,
} from '../services/dashboardPreferencesService'

/** Fetch and manage dashboard preferences for the current company. */
export function useDashboardPreferences() {
  const queryClient = useQueryClient()
  const { user } = useSelector((state) => state.auth)
  const { profile } = useSelector((state) => state.profile)

  const userId = user?.id
  const companyId = profile?.company_id

  // Cache independently per company
  const queryKey = ['dashboardPreferences', userId, companyId]

  const query = useQuery({
    queryKey,
    queryFn: () => fetchDashboardPreferences(userId, companyId),
    // Wait until full tenant context is available
    enabled: !!userId && !!companyId,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 1,
    refetchOnWindowFocus: false,
  })

  const mutation = useMutation({
    mutationFn: (newPrefs) => upsertDashboardPreferences(userId, companyId, newPrefs),

    onMutate: async (newPrefs) => {
      await queryClient.cancelQueries({ queryKey })
      const snapshot = queryClient.getQueryData(queryKey)
      queryClient.setQueryData(queryKey, newPrefs) // Optimistic cache update for better UX
      return { snapshot }
    },

    onError: (_err, _newPrefs, context) => {
      if (context?.snapshot !== undefined) {
        queryClient.setQueryData(queryKey, context.snapshot)
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey }) // Sync cache after mutation
    },
  })

  const rawPrefs = query.data ?? null
  const widgetOrder = rawPrefs?.widget_order ?? DEFAULT_WIDGET_ORDER
  const hiddenWidgets = rawPrefs?.hidden_widgets ?? DEFAULT_HIDDEN_WIDGETS

  return {
    widgetOrder,
    hiddenWidgets,
    isLoading: query.isLoading,
    isSaving: mutation.isPending,
    isError: query.isError,

    updatePreferences: (newOrder, newHidden) =>
      mutation.mutate({ widget_order: newOrder, hidden_widgets: newHidden }),
    resetPreferences: () =>
      mutation.mutate({
        widget_order: DEFAULT_WIDGET_ORDER,
        hidden_widgets: DEFAULT_HIDDEN_WIDGETS,
      }),
  }
}
