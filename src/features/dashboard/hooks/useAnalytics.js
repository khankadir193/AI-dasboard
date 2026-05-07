import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { supabase } from '../../../lib/supabaseClient'
import { analyticsApi } from '../../../lib/analyticsApi'

export const useAnalytics = () => {
  const { user } = useSelector((state) => state.auth)
  const { profile } = useSelector((state) => state.profile)
  
  const [analyticsData, setAnalyticsData] = useState({
    activityTimelineData: [],
    userActivityData: [],
    projectStatusData: [],
    recentActivity: [],
    kpiData: {
      activeUsers: 0,
      projectsCreated: 0,
      projectsDeleted: 0,
      dashboardViews: 0,
      projectsUpdated: 0
    },
    isLoading: true,
    error: null
  })

  const fetchAnalyticsData = async () => {
    // GUARD 1: Do NOT fetch if user or company_id is not ready
    if (!user?.id || !profile?.company_id) {
      setAnalyticsData({
        activityTimelineData: [],
        userActivityData: [],
        projectStatusData: [],
        recentActivity: [],
        kpiData: {
          activeUsers: 0,
          projectsCreated: 0,
          projectsDeleted: 0,
          dashboardViews: 0,
          projectsUpdated: 0
        },
        isLoading: false,
        error: null
      })
      return
    }

    try {
      setAnalyticsData(prev => ({ ...prev, isLoading: true, error: null }))

      // Get user profile to set company ID
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .maybeSingle()

      if (profileError || !profileData?.company_id) {
        throw new Error('Company not found')
      }

      // Set company ID in analytics API
      analyticsApi.setCompanyId(profileData.company_id)

      // Fetch all analytics data in parallel
      const [activityTimelineData, userActivityData, projectStatusData, recentActivity, kpiData] = await Promise.all([
        analyticsApi.fetchActivityTimelineData(14).catch(() => []),
        analyticsApi.fetchActivityTimelineData(14).catch(() => []),
        analyticsApi.fetchProjectStatusData().catch(() => []),
        analyticsApi.fetchRecentActivity(10).catch(() => []),
        analyticsApi.fetchKPIData().catch(() => ({
          activeUsers: 0,
          projectsCreated: 0,
          projectsDeleted: 0,
          dashboardViews: 0,
          projectsUpdated: 0
        }))
      ])

      setAnalyticsData({
        activityTimelineData,
        userActivityData,
        projectStatusData,
        recentActivity,
        kpiData,
        isLoading: false,
        error: null
      })
    } catch (error) {
      setAnalyticsData({
        activityTimelineData: [],
        userActivityData: [],
        projectStatusData: [],
        recentActivity: [],
        kpiData: {
          activeUsers: 0,
          projectsCreated: 0,
          projectsDeleted: 0,
          dashboardViews: 0,
          projectsUpdated: 0
        },
        isLoading: false,
        error: error.message
      })
    }
  }

  useEffect(() => {
    // Only fetch when profile's company_id is available
    if (!profile?.company_id) {
      return
    }
    fetchAnalyticsData()
  }, [profile?.company_id])

  return { analyticsData, fetchAnalyticsData }
}

