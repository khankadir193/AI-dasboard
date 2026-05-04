import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { supabase } from '../../../lib/supabaseClient'
import { analyticsApi } from '../../../lib/analyticsApi'

export const useAnalytics = () => {
  const { user } = useSelector((state) => state.auth)
  const { profile } = useSelector((state) => state.profile)
  
  const [analyticsData, setAnalyticsData] = useState({
    revenueData: [],
    usersData: [],
    projectStatusData: [],
    kpiData: {
      totalRevenue: 0,
      activeUsers: 0,
      conversionRate: 0,
      newOrders: 0
    },
    isLoading: true,
    error: null
  })

  const fetchAnalyticsData = async () => {
    // DEBUG: Log current state
    console.log("DASHBOARD -> PROFILE:", profile)
    console.log("DASHBOARD -> COMPANY ID:", profile?.company_id)

    // GUARD 1: Do NOT fetch if user or company_id is not ready
    if (!user?.id || !profile?.company_id) {
      console.log("DASHBOARD -> Guarding: user or company_id not ready")
      setAnalyticsData({
        revenueData: [],
        usersData: [],
        projectStatusData: [],
        kpiData: {
          totalRevenue: 0,
          activeUsers: 0,
          conversionRate: 0,
          newOrders: 0
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
      const [revenueData, usersData, projectStatusData, kpiData] = await Promise.all([
        analyticsApi.fetchRevenueData(14).catch(() => []),
        analyticsApi.fetchUsersData(14).catch(() => []),
        analyticsApi.fetchProjectStatusData().catch(() => []),
        analyticsApi.fetchKPIData().catch(() => ({
          totalRevenue: 0,
          activeUsers: 0,
          conversionRate: 0,
          newOrders: 0
        }))
      ])

      setAnalyticsData({
        revenueData,
        usersData,
        projectStatusData,
        kpiData,
        isLoading: false,
        error: null
      })

      // Generate sample data if no data exists
      if (revenueData.length === 0 && usersData.length === 0) {
        try {
          await analyticsApi.generateSampleData()
          // Retry fetching after generating sample data
          const [newRevenueData, newUsersData] = await Promise.all([
            analyticsApi.fetchRevenueData(14),
            analyticsApi.fetchUsersData(14)
          ])
          setAnalyticsData(prev => ({
            ...prev,
            revenueData: newRevenueData,
            usersData: newUsersData
          }))
        } catch (sampleError) {
          console.warn('Could not generate sample data:', sampleError)
        }
      }
    } catch (error) {
      console.error('Error fetching analytics data:', error)
      setAnalyticsData({
        revenueData: [],
        usersData: [],
        projectStatusData: [],
        kpiData: {
          totalRevenue: 0,
          activeUsers: 0,
          conversionRate: 0,
          newOrders: 0
        },
        isLoading: false,
        error: error.message
      })
    }
  }

  useEffect(() => {
    // Only fetch when profile's company_id is available
    if (!profile?.company_id) {
      console.log("DASHBOARD -> useEffect: company_id not ready, skipping fetch")
      return
    }
    console.log("DASHBOARD -> useEffect: company_id ready, fetching data")
    fetchAnalyticsData()
  }, [profile?.company_id])

  return { analyticsData, fetchAnalyticsData }
}

