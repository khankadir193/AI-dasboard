import { useQuery } from '@tanstack/react-query'
import { fetchActivityLogs } from '../services/activityLogService'

export function useActivityLogs({ companyId, page = 1, pageSize = 20, action, resourceType, startDate, endDate, search }) {
  return useQuery({
    queryKey: ['activityLogs', companyId, page, pageSize, action, resourceType, startDate, endDate, search],
    queryFn: () => fetchActivityLogs({ companyId, page, pageSize, action, resourceType, startDate, endDate, search }),
    enabled: !!companyId,
    staleTime: 0,
    retry: 1,
    refetchInterval: 30000,
  })
}
