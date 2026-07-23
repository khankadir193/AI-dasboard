import { useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { fetchHeatmapData } from '../services/activityHeatmapService'

/**
 * Fetches activity heatmap data for the current user's company and the
 * selected date range.
 *
 * Cache key includes companyId + startDate + endDate so different ranges
 * cache independently — switching filters causes a real refetch.
 *
 * staleTime: 10 minutes — heatmap data changes slowly within a fixed
 * historical window; aggressive refetching adds unnecessary load.
 *
 * refetchOnWindowFocus: false — heatmap is historical; no need to
 * re-query when the user switches browser tabs.
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

