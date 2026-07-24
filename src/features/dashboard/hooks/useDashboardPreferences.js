import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import {
  fetchDashboardPreferences,
  upsertDashboardPreferences,
  DEFAULT_WIDGET_ORDER,
  DEFAULT_HIDDEN_WIDGETS,
} from '../services/dashboardPreferencesService'

/**
 * Manages the user's dashboard widget preferences.
 *
 * Scoped by BOTH user_id AND company_id — critical for:
 *   - Admins who belong to multiple tenants (each gets an independent layout).
 *   - Company isolation: switching companies shows that company's saved layout.
 *
 * Key decisions:
 *   - enabled: !!userId && !!companyId — the query must NOT fire until the full
 *     tenant context is available. Firing with only userId (before the profile
 *     loads) would call fetchDashboardPreferences without a company filter,
 *     potentially returning the wrong row or null incorrectly.
 *   - staleTime: Infinity — preferences are user-owned data. They only change
 *     via the mutation in this hook. Background staleness never applies.
 *   - gcTime: Infinity — keep in cache for the session lifetime; the data is tiny.
 *   - refetchOnWindowFocus: false — no external changes to poll for.
 *   - The query runs in PARALLEL with useDashboardAnalytics — it does NOT gate
 *     the dashboard render. The dashboard renders with default order immediately
 *     while preferences load (typically < 200 ms).
 *
 * Optimistic update + rollback:
 *   - onMutate: cancel pending queries, snapshot current cache value, apply optimistic update.
 *   - onError: roll back to snapshot.
 *   - onSettled: invalidate to sync with server truth.
 *
 * No auto-insert on load:
 *   - If no row exists, the query returns null and the hook falls back to defaults.
 *   - The database row is created only when the user explicitly saves for the first time.
 *   - This keeps the DB clean for users who never customise their layout.
 *
 * @returns {{ widgetOrder, hiddenWidgets, isLoading, isSaving, isError, updatePreferences, resetPreferences }}
 */
export function useDashboardPreferences() {
  const queryClient = useQueryClient()
  const { user } = useSelector((state) => state.auth)
  const { profile } = useSelector((state) => state.profile)

  const userId = user?.id
  const companyId = profile?.company_id

  // Include companyId in the cache key so different companies cache independently.
  // When the user switches companies, companyId changes → new cache entry → new fetch.
  const queryKey = ['dashboardPreferences', userId, companyId]

  const query = useQuery({
    queryKey,
    queryFn: () => fetchDashboardPreferences(userId, companyId),
    // CRITICAL FIX: must have BOTH userId AND companyId before fetching.
    // Previously this was only !!userId, which caused the query to fire before
    // the profile (and companyId) loaded — returning the wrong row or null.
    enabled: !!userId && !!companyId,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 1,
    refetchOnWindowFocus: false,
  })

  const mutation = useMutation({
    mutationFn: (newPrefs) => upsertDashboardPreferences(userId, companyId, newPrefs),

    onMutate: async (newPrefs) => {
      // Cancel any in-flight fetches so they don't overwrite the optimistic value
      await queryClient.cancelQueries({ queryKey })
      // Snapshot the current cache value for rollback
      const snapshot = queryClient.getQueryData(queryKey)
      // Apply optimistic update immediately so the UI reflects the save instantly
      queryClient.setQueryData(queryKey, newPrefs)
      return { snapshot }
    },

    onError: (_err, _newPrefs, context) => {
      // Roll back to the snapshot on failure so the UI is consistent with DB truth
      if (context?.snapshot !== undefined) {
        queryClient.setQueryData(queryKey, context.snapshot)
      }
    },

    onSettled: () => {
      // Always sync with server truth after success or failure
      queryClient.invalidateQueries({ queryKey })
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
    /** True if the last fetch failed — UI can show an error recovery state */
    isError: query.isError,
    /**
     * Persist new order + visibility.
     * Creates the DB row on first call (no row exists yet); updates on subsequent calls.
     * @param {string[]} newOrder  - widget slot IDs in desired order
     * @param {string[]} newHidden - widget IDs to hide
     */
    updatePreferences: (newOrder, newHidden) =>
      mutation.mutate({ widget_order: newOrder, hidden_widgets: newHidden }),
    /**
     * Reset to factory defaults and persist the reset state.
     * Also creates the DB row on first call if the user has never saved before.
     */
    resetPreferences: () =>
      mutation.mutate({
        widget_order: DEFAULT_WIDGET_ORDER,
        hidden_widgets: DEFAULT_HIDDEN_WIDGETS,
      }),
  }
}
