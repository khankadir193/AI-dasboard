import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import {
  fetchDashboardPreferences,
  upsertDashboardPreferences,
  DEFAULT_WIDGET_ORDER,
  DEFAULT_HIDDEN_WIDGETS,
} from '../services/dashboardPreferencesService'

/**
 * The fallback applied when no row exists in dashboard_preferences.
 * This is what ALL existing users will see — zero behavior change.
 */
const EMPTY_PREFS = {
  widget_order: DEFAULT_WIDGET_ORDER,
  hidden_widgets: DEFAULT_HIDDEN_WIDGETS,
}

/**
 * Manages the user's dashboard widget preferences.
 *
 * Key decisions:
 *   - staleTime: Infinity — preferences are user-owned; they only change via
 *     the mutation in this hook. Background staleness never applies.
 *   - gcTime: Infinity — keep in cache for the session lifetime; the data is tiny.
 *   - refetchOnWindowFocus: false — no external changes to poll for.
 *   - The query runs IN PARALLEL with useDashboardAnalytics — it does NOT gate
 *     the dashboard render. Dashboard renders with default order immediately
 *     while preferences load.
 *
 * Optimistic update + rollback:
 *   - onMutate: cancel pending queries, snapshot current value, apply optimistic update.
 *   - onError: roll back to snapshot.
 *   - onSettled: invalidate to sync with server truth.
 *   (First true optimistic-with-rollback hook in this codebase.)
 *
 * @returns {{ widgetOrder, hiddenWidgets, isLoading, isSaving, updatePreferences, resetPreferences }}
 */
export function useDashboardPreferences() {
  const queryClient = useQueryClient()
  const { user } = useSelector((state) => state.auth)
  const userId = user?.id

  const query = useQuery({
    queryKey: ['dashboardPreferences', userId],
    queryFn: () => fetchDashboardPreferences(userId),
    enabled: !!userId,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 1,
    refetchOnWindowFocus: false,
  })

  const mutation = useMutation({
    mutationFn: (newPrefs) => upsertDashboardPreferences(userId, newPrefs),

    onMutate: async (newPrefs) => {
      // Cancel any in-flight fetches so they don't overwrite the optimistic value
      await queryClient.cancelQueries({ queryKey: ['dashboardPreferences', userId] })
      // Snapshot the current cache value for rollback
      const snapshot = queryClient.getQueryData(['dashboardPreferences', userId])
      // Apply optimistic update immediately
      queryClient.setQueryData(['dashboardPreferences', userId], newPrefs)
      return { snapshot }
    },

    onError: (_err, _newPrefs, context) => {
      // Roll back to the snapshot on failure
      if (context?.snapshot !== undefined) {
        queryClient.setQueryData(['dashboardPreferences', userId], context.snapshot)
      }
    },

    onSettled: () => {
      // Sync with server truth after success or failure
      queryClient.invalidateQueries({ queryKey: ['dashboardPreferences', userId] })
    },
  })

  const rawPrefs = query.data ?? null
  const widgetOrder = rawPrefs?.widget_order ?? DEFAULT_WIDGET_ORDER
  const hiddenWidgets = rawPrefs?.hidden_widgets ?? DEFAULT_HIDDEN_WIDGETS

  return {
    /** Ordered array of widget slot IDs */
    widgetOrder,
    /** Array of individually-hidden widget IDs */
    hiddenWidgets,
    /** True only during the initial load (not during background refreshes) */
    isLoading: query.isLoading,
    /** True while a save mutation is in flight */
    isSaving: mutation.isPending,
    /**
     * Persist new order + visibility.
     * @param {string[]} newOrder - widget slot IDs in desired order
     * @param {string[]} newHidden - widget IDs to hide
     */
    updatePreferences: (newOrder, newHidden) =>
      mutation.mutate({ widget_order: newOrder, hidden_widgets: newHidden }),
    /**
     * Reset to factory defaults and delete the user's saved row.
     */
    resetPreferences: () =>
      mutation.mutate({
        widget_order: DEFAULT_WIDGET_ORDER,
        hidden_widgets: DEFAULT_HIDDEN_WIDGETS,
      }),
  }
}
