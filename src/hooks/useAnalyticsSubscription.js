import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'

export function useAnalyticsSubscription(companyId) {
  const queryClient = useQueryClient()
  const companyIdRef = useRef(companyId)

  useEffect(() => {
    companyIdRef.current = companyId
  })

  useEffect(() => {
    if (!companyId) return

    const channel = supabase
      .channel('analytics_realtime_shared')
      .on('postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'analytics_data',
          filter: `company_id=eq.${companyId}`
        },
        () => {
          const id = companyIdRef.current
          if (!id) return
          queryClient.invalidateQueries({ queryKey: ['dashboardAnalytics', id], refetchType: 'all' })
          queryClient.invalidateQueries({ queryKey: ['analyticsPage', id], refetchType: 'all' })
          queryClient.invalidateQueries({ queryKey: ['recentActivity', id], refetchType: 'all' })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [companyId, queryClient])
}
