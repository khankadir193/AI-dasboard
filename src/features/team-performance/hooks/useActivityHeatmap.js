import { useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { fetchHeatmapData } from '../services/activityHeatmapService'

/**
 * Fetches 90-day activity heatmap data for the current user's company.
 *
 * No date params in cache key — the window is always "today − 90 days",
 * so the key is just ['activityHeatmap', companyId].
 *
 * staleTime: 10 minutes — the 90-day window changes slowly; aggressive
 * refetching on this query would add unnecessary load for a non-live chart.
 *
 * refetchOnWindowFocus: false — heatmap is decorative/historical; no need
 * to re-query when the user switches browser tabs.
 */
export function useActivityHeatmap() {
  const { profile } = useSelector((state) => state.profile)
  const companyId = profile?.company_id

  return useQuery({
    queryKey: ['activityHeatmap', companyId],
    queryFn: () => fetchHeatmapData({ companyId }),
    enabled: !!companyId,
    staleTime: 1000 * 60 * 10, // 10 minutes
    retry: 1,
    refetchOnWindowFocus: false,
  })
}
