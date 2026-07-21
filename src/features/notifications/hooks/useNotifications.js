import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import {
  fetchNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
} from '../api/notificationsService'

export function useNotifications(filters = {}) {
  const { profile } = useSelector((state) => state.profile)
  const companyId = profile?.company_id

  const { page = 1, pageSize = 20, type, priority, isRead, startDate, endDate } = filters

  return useQuery({
    queryKey: ['notifications', companyId, page, pageSize, type, priority, isRead, startDate, endDate],
    queryFn: () => fetchNotifications({ companyId, page, pageSize, type, priority, isRead, startDate, endDate }),
    enabled: !!companyId,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchInterval: 30000,
    retry: 1,
  })
}

export function useUnreadCount() {
  const { profile } = useSelector((state) => state.profile)
  const companyId = profile?.company_id

  return useQuery({
    queryKey: ['notifications', 'unreadCount', companyId],
    queryFn: () => getUnreadCount(companyId),
    enabled: !!companyId,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchInterval: 20000,
    retry: 0,
  })
}

export function useMarkAsRead() {
  const queryClient = useQueryClient()
  const { profile } = useSelector((state) => state.profile)
  const companyId = profile?.company_id

  return useMutation({
    mutationFn: (notificationId) => markAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', companyId] })
    },
    retry: 1,
  })
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient()
  const { profile } = useSelector((state) => state.profile)
  const companyId = profile?.company_id

  return useMutation({
    mutationFn: () => markAllAsRead(companyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', companyId] })
    },
    retry: 1,
  })
}
