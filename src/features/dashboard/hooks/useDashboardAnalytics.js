import { useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { analyticsService } from '../../../services/analyticsService'

export function useDashboardAnalytics(dateRange) {
  const { profile } = useSelector((state) => state.profile)

  const companyId = profile?.company_id
  const startDate = dateRange?.startDate
  const endDate = dateRange?.endDate

  return useQuery({
    queryKey: ['dashboardAnalytics', companyId, startDate, endDate],
    queryFn: async () => {
      analyticsService.setCompanyId(companyId)
      return analyticsService.getAllDashboardData(startDate, endDate)
    },
    enabled: !!companyId && !!startDate && !!endDate,
    staleTime: 0,
    retry: 1,
    refetchInterval: 30000,
    refetchOnWindowFocus: true
  })
}
