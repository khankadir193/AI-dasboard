import { useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { analyticsService } from '../../../services/analyticsService'

export function useRecentActivity(dateRange, limit = 10) {
  const { profile } = useSelector((state) => state.profile)

  const companyId = profile?.company_id
  const startDate = dateRange?.startDate
  const endDate = dateRange?.endDate

  return useQuery({
    queryKey: ['recentActivity', companyId, startDate, endDate, limit],
    queryFn: async () => {
      analyticsService.setCompanyId(companyId)
      return analyticsService.getRecentActivity(startDate, endDate, limit)
    },
    enabled: !!companyId,
    staleTime: 1000 * 60 * 5,
    retry: 1,
    refetchOnWindowFocus: false
  })
}
