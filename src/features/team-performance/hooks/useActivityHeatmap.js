import { useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { fetchHeatmapData } from '../services/activityHeatmapService'

/**
 * Hook kept for standalone / independent heatmap use cases.
 *
 * In TeamPerformancePage, this hook is NOT called — heatmap data is derived
 * from the `useTeamPerformance` result (`data.heatmapDays`) to avoid making
 * a second Supabase request for the same activity_logs data.
 *
 * This hook remains available for future pages or widgets that need only the
 * heatmap without the full team performance analytics suite.
 *
 * @param {{ startDate: string, endDate: string }} dateRange
 */
export function useActivityHeatmap(dateRange) {
  const { profile } = useSelector((state) => state.profile)
  const companyId = profile?.company_id
  const startDate = dateRange?.startDate
  const endDate = dateRange?.endDate

  return useQuery({
    queryKey: ['activityHeatmap', companyId, startDate, endDate],
    queryFn: () => fetchHeatmapData({ companyId, startDate, endDate }),
    enabled: !!companyId && !!startDate && !!endDate,
    staleTime: 1000 * 60 * 10, // 10 minutes
    retry: 1,
    refetchOnWindowFocus: false,
  })
}
