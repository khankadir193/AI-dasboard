import { useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { fetchTeamPerformanceData } from '../services/teamPerformanceService'

/**
 * Fetches team performance analytics scoped to the current user's company.
 *
 * Cache key includes companyId + date range to prevent cross-company collisions
 * and to invalidate correctly when the user changes the DateRangeFilter.
 *
 * staleTime: 5 minutes — matches useRecentActivity (same underlying data source:
 * activity_logs + projects). Not a live feed; occasional staleness is acceptable.
 *
 * @param {{ startDate: string, endDate: string }} dateRange
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
