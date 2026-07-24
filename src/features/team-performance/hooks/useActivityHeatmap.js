import { useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { fetchHeatmapData } from '../services/activityHeatmapService'

/** Hook for standalone heatmap data fetching. */
export function useActivityHeatmap(dateRange) {
  const { profile } = useSelector((state) => state.profile)
  const companyId = profile?.company_id
  const startDate = dateRange?.startDate
  const endDate = dateRange?.endDate

  return useQuery({
    queryKey: ['activityHeatmap', companyId, startDate, endDate],
    queryFn: () => fetchHeatmapData({ companyId, startDate, endDate }),
    enabled: !!companyId && !!startDate && !!endDate,
    staleTime: 1000 * 60 * 10,
    retry: 1,
    refetchOnWindowFocus: false,
  })
}
