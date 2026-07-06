import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { supabase } from '../../../lib/supabaseClient'
import { analyticsApi } from '../../../lib/analyticsApi'

const EMPTY_KPI = {
  activeUsers: 0,
  projectsCreated: 0,
  projectsDeleted: 0,
  dashboardViews: 0,
  projectsUpdated: 0
}

const EMPTY_STATE = {
  activityTimelineData: [],
  userActivityData: [],
  projectStatusData: [],
  recentActivity: [],
  kpiData: { ...EMPTY_KPI },
  growthData: { ...EMPTY_KPI },
  isLoading: true,
  error: null
}

function computeGrowth(curr, prev) {
  return prev === 0 ? 0 : Math.round(((curr - prev) / prev) * 100)
}

function aggregateKPI(rows) {
  const kpi = { ...EMPTY_KPI }
  ;(rows || []).forEach(item => {
    const val = parseInt(item.metric_value ?? 0, 10)
    switch (item.metric_type) {
      case 'active_users': kpi.activeUsers += val; break
      case 'projects_created': kpi.projectsCreated += val; break
      case 'projects_deleted': kpi.projectsDeleted += val; break
      case 'dashboard_view': kpi.dashboardViews += val; break
      case 'projects_updated': kpi.projectsUpdated += val; break
    }
  })
  return kpi
}

function buildTimeline(rows) {
  const map = {}
  ;(rows || []).forEach(item => {
    const date = new Date(item.metric_date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
    if (!map[date]) map[date] = { date, count: 0 }
    map[date].count += parseInt(item.metric_value ?? 1, 10)
  })
  return Object.values(map)
}

export const useAnalytics = (dateRange) => {
  const { user } = useSelector((state) => state.auth)
  const { profile } = useSelector((state) => state.profile)

  const [analyticsData, setAnalyticsData] = useState(EMPTY_STATE)

  const fetchAnalyticsData = async (startDate, endDate) => {
    if (!user?.id || !profile?.company_id) {
      setAnalyticsData(s => ({ ...s, ...EMPTY_STATE, isLoading: false }))
      return
    }

    try {
      setAnalyticsData(prev => ({ ...prev, isLoading: true, error: null }))

      analyticsApi.setCompanyId(profile.company_id)

      // Compute previous period (same duration, shifted back)
      const rangeMs = new Date(endDate) - new Date(startDate)
      const prevEnd = new Date(new Date(startDate).getTime() - 86400000)
      const prevStart = new Date(prevEnd.getTime() - rangeMs)
      const fmt = d => d.toISOString().split('T')[0]

      // Single fetch for current + previous + project status + recent
      const [currentData, previousData, projectStatusData, recentActivity] = await Promise.all([
        analyticsApi.fetchAllData(startDate, endDate).catch(() => []),
        analyticsApi.fetchAllData(fmt(prevStart), fmt(prevEnd)).catch(() => []),
        analyticsApi.fetchProjectStatusData().catch(() => []),
        analyticsApi.fetchRecentActivity(startDate, endDate, 10).catch(() => [])
      ])

      const kpiData = aggregateKPI(currentData)
      const prevKpi = aggregateKPI(previousData)
      const growthData = {
        activeUsers: computeGrowth(kpiData.activeUsers, prevKpi.activeUsers),
        projectsCreated: computeGrowth(kpiData.projectsCreated, prevKpi.projectsCreated),
        projectsDeleted: computeGrowth(kpiData.projectsDeleted, prevKpi.projectsDeleted),
        dashboardViews: computeGrowth(kpiData.dashboardViews, prevKpi.dashboardViews),
        projectsUpdated: computeGrowth(kpiData.projectsUpdated, prevKpi.projectsUpdated)
      }
      const activityTimelineData = buildTimeline(currentData)

      setAnalyticsData({
        activityTimelineData,
        userActivityData: activityTimelineData,
        projectStatusData,
        recentActivity,
        kpiData,
        growthData,
        isLoading: false,
        error: null
      })
    } catch (error) {
      setAnalyticsData({
        ...EMPTY_STATE,
        isLoading: false,
        error: error.message
      })
    }
  }

  // Fetch on mount and when company/dateRange changes
  useEffect(() => {
    if (!profile?.company_id) return

    analyticsApi.setCompanyId(profile.company_id)

    const start = dateRange?.startDate
    const end = dateRange?.endDate

    if (start && end) {
      fetchAnalyticsData(start, end)
    } else {
      const now = new Date()
      const ago = new Date()
      ago.setDate(ago.getDate() - 30)
      fetchAnalyticsData(ago.toISOString().split('T')[0], now.toISOString().split('T')[0])
    }
  }, [profile?.company_id, dateRange?.startDate, dateRange?.endDate])

  // Realtime: auto-refresh when new analytics_data row is inserted
  useEffect(() => {
    if (!profile?.company_id) return

    const channel = supabase
      .channel('analytics_realtime')
      .on('postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'analytics_data',
          filter: `company_id=eq.${profile.company_id}`
        },
        () => {
          const start = dateRange?.startDate
          const end = dateRange?.endDate
          if (start && end) {
            fetchAnalyticsData(start, end)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [profile?.company_id, dateRange?.startDate, dateRange?.endDate])

  return { analyticsData, fetchAnalyticsData }
}

