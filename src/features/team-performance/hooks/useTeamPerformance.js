import { useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { fetchTeamPerformanceData } from '../services/teamPerformanceService'

/**
 * Fetches all team performance analytics for the current company and date range.
 *
 * Single Supabase round-trip — the query result now includes `heatmapDays`
 * derived from the same logs batch. This eliminates the duplicate fetch that
 * useActivityHeatmap previously made independently for the same data.
 *
 * The TeamPerformancePage consumes `data.heatmapDays` directly and passes it
 * to <ActivityHeatmap> — no second hook call needed.
 *
 * Cache key: ['teamPerformance', companyId, startDate, endDate]
 * Changing the date filter causes a real refetch (different cache entry).
 *
 * staleTime: 5 minutes — matches analytics data freshness expectations.
 * Not a live feed; occasional staleness is acceptable.
 *
 * @param {{ startDate: string, endDate: string, preset?: string, label?: string }} dateRange
 */
export function useTeamPerformance(dateRange) {
  const { profile } = useSelector((state) => state.profile)
  const companyId = profile?.company_id
  const startDate = dateRange?.startDate
  const endDate = dateRange?.endDate

  return useQuery({
    queryKey: ['teamPerformance', companyId, startDate, endDate],
    queryFn: () => fetchTeamPerformanceData({ companyId, startDate, endDate }),
    enabled: !!companyId && !!startDate && !!endDate,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
    refetchOnWindowFocus: false,
  })
}
