import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import {
  generateReport,
  fetchReports,
  deleteReport,
  getReportById,
} from '../api/reportsService'

export function useReports(filters = {}) {
  const { profile } = useSelector((state) => state.profile)
  const companyId = profile?.company_id

  const { page = 1, pageSize = 10, type } = filters

  return useQuery({
    queryKey: ['reports', companyId, page, pageSize, type],
    queryFn: () => fetchReports({ companyId, page, pageSize, type }),
    enabled: !!companyId,
    staleTime: 30000,
    retry: 1,
  })
}

export function useReportById(reportId) {
  const { profile } = useSelector((state) => state.profile)
  const companyId = profile?.company_id

  return useQuery({
    queryKey: ['reports', 'detail', reportId],
    queryFn: () => getReportById(reportId),
    enabled: !!companyId && !!reportId,
    staleTime: 60000,
    retry: 1,
  })
}

export function useGenerateReport() {
  const queryClient = useQueryClient()
  const { profile } = useSelector((state) => state.profile)

  return useMutation({
    mutationFn: ({ type, title }) =>
      generateReport({
        companyId: profile?.company_id,
        type,
        title,
        userId: profile?.id,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] })
    },
    retry: 1,
  })
}

export function useDeleteReport() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (reportId) => deleteReport(reportId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] })
    },
    retry: 1,
  })
}
