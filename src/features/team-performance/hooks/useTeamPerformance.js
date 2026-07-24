import { useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { fetchTeamPerformanceData } from '../services/teamPerformanceService'

/** Fetch all team performance analytics for the current company and date range. */
export function useTeamPerformance(dateRange) {
  const { profile } = useSelector((state) => state.profile)
  const companyId = profile?.company_id
  const startDate = dateRange?.startDate
  const endDate = dateRange?.endDate

  return useQuery({
    queryKey: ['teamPerformance', companyId, startDate, endDate],
    queryFn: () => fetchTeamPerformanceData({ companyId, startDate, endDate }),
    enabled: !!companyId && !!startDate && !!endDate,
    staleTime: 1000 * 60 * 5,
    retry: 1,
    refetchOnWindowFocus: false,
  })
}
