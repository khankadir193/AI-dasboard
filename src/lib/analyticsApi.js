import { supabase } from './supabaseClient'

class AnalyticsApiService {
  constructor() {
    this.currentCompanyId = null
  }

  // Set current company ID
  setCompanyId(companyId) {
    this.currentCompanyId = companyId
  }

  // Get current company ID
  getCompanyId() {
    return this.currentCompanyId
  }

  // Fetch analytics data with company filtering
  async fetchAnalyticsData(metricType, dateRange = 30) {
    if (!this.currentCompanyId) {
      throw new Error('Company ID not set. Please authenticate first.')
    }

    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - dateRange)

      const { data, error } = await supabase
        .from('analytics_data')
        .select('*')
        .eq('company_id', this.currentCompanyId)
        .eq('metric_type', metricType)
        .gte('metric_date', startDate.toISOString().split('T')[0])
        .order('metric_date', { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error(`Error fetching ${metricType} data:`, error)
      throw error
    }
  }

  // Fetch revenue data for area chart
  async fetchRevenueData(dateRange = 30) {
    const data = await this.fetchAnalyticsData('revenue', dateRange)
    return data.map(item => ({
      date: new Date(item.metric_date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      }),
      revenue: parseFloat(item.metric_value ?? 0),
      fullDate: item.metric_date
    }))
  }

  // Fetch users data for line chart
  async fetchUsersData(dateRange = 30) {
    const data = await this.fetchAnalyticsData('users', dateRange)
    return data.map(item => ({
      date: new Date(item.metric_date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      }),
      users: parseInt(item.metric_value ?? 0),
      fullDate: item.metric_date
    }))
  }

  // Fetch project status data for pie chart
  async fetchProjectStatusData() {
    if (!this.currentCompanyId) {
      throw new Error('Company ID not set. Please authenticate first.')
    }

    try {
      // Get project counts by status
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('status')
        .eq('company_id', this.currentCompanyId)

      if (projectsError) throw projectsError

      // Count projects by status
      const statusCounts = projects?.reduce((acc, project) => {
        acc[project.status] = (acc[project.status] || 0) + 1
        return acc
      }, {}) || {}

      // Transform to pie chart format
      const colors = {
        active: '#10b981',
        inactive: '#f59e0b', 
        archived: '#ef4444'
      }

      return Object.entries(statusCounts).map(([status, count]) => ({
        name: status.charAt(0).toUpperCase() + status.slice(1),
        value: count,
        fill: colors[status] || '#6b7280'
      }))
    } catch (error) {
      console.error('Error fetching project status data:', error)
      throw error
    }
  }

  // Fetch KPI data for dashboard cards
  async fetchKPIData() {
    if (!this.currentCompanyId) {
      throw new Error('Company ID not set. Please authenticate first.')
    }

    try {
      // Fetch analytics data for last 30 days
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 30)

      const { data: analyticsData, error: analyticsError } = await supabase
        .from('analytics_data')
        .select('*')
        .eq('company_id', this.currentCompanyId)
        .gte('metric_date', startDate.toISOString().split('T')[0])
        .lte('metric_date', endDate.toISOString().split('T')[0])

      if (analyticsError) throw analyticsError

      // Calculate real KPIs from tracked events
      let activeUsers = 0
      let projectsCreated = 0
      let projectsDeleted = 0
      let dashboardViews = 0
      let projectsUpdated = 0

      analyticsData?.forEach(item => {
        switch (item.metric_type) {
          case 'active_users':
            activeUsers += parseInt(item.metric_value ?? 0)
            break
          case 'dashboard_view':
            dashboardViews += parseInt(item.metric_value ?? 0)
            break
          case 'projects_created':
            projectsCreated += parseInt(item.metric_value ?? 0)
            break
          case 'projects_updated':
            projectsUpdated += parseInt(item.metric_value ?? 0)
            break
          case 'projects_deleted':
            projectsDeleted += parseInt(item.metric_value ?? 0)
            break
        }
      })

      return {
        activeUsers,
        projectsCreated,
        projectsDeleted,
        dashboardViews,
        projectsUpdated
      }
    } catch (error) {
      throw error
    }
  }

  // Fetch activity timeline data for chart
  async fetchActivityTimelineData(dateRange = 30) {
    if (!this.currentCompanyId) {
      throw new Error('Company ID not set. Please authenticate first.')
    }

    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - dateRange)

      const { data, error } = await supabase
        .from('analytics_data')
        .select('*')
        .eq('company_id', this.currentCompanyId)
        .gte('metric_date', startDate.toISOString().split('T')[0])
        .order('metric_date', { ascending: true })

      if (error) throw error

      // Group events by date
      const eventsByDate = data?.reduce((acc, item) => {
        const date = new Date(item.metric_date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        })
        if (!acc[date]) {
          acc[date] = { date, count: 0 }
        }
        acc[date].count += parseInt(item.metric_value ?? 1)
        return acc
      }, {}) || {}

      return Object.values(eventsByDate)
    } catch (error) {
      console.error('Error fetching activity timeline data:', error)
      throw error
    }
  }

  // Fetch ALL analytics_data in a date range (single query for KPIs + timeline + distribution)
  async fetchAllData(startDate, endDate) {
    if (!this.currentCompanyId) {
      throw new Error('Company ID not set. Please authenticate first.')
    }

    try {
      const { data, error } = await supabase
        .from('analytics_data')
        .select('*')
        .eq('company_id', this.currentCompanyId)
        .gte('metric_date', startDate)
        .lte('metric_date', endDate)
        .order('metric_date', { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching analytics data:', error)
      throw error
    }
  }

  // Fetch recent activity for activity feed, filtered by date range
  async fetchRecentActivity(startDate = null, endDate = null, limit = 10) {
    if (!this.currentCompanyId) {
      throw new Error('Company ID not set. Please authenticate first.')
    }

    // Support legacy call: fetchRecentActivity(10)
    if (typeof startDate === 'number') {
      limit = startDate
      startDate = null
      endDate = null
    }

    try {
      let query = supabase
        .from('analytics_data')
        .select('*')
        .eq('company_id', this.currentCompanyId)

      if (startDate) {
        query = query.gte('metric_date', startDate)
      }
      if (endDate) {
        query = query.lte('metric_date', endDate)
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('Error fetching recent activity:', error)
      throw error
    }
  }

  // Insert analytics data (for testing/demo)
  async insertAnalyticsData(metricType, metricValue, metricDate = null, metadata = {}) {
    if (!this.currentCompanyId) {
      throw new Error('Company ID not set. Please authenticate first.')
    }

    try {
      const { data, error } = await supabase
        .from('analytics_data')
        .insert({
          company_id: this.currentCompanyId,
          metric_type: metricType,
          metric_value: metricValue,
          metric_date: metricDate || new Date().toISOString().split('T')[0],
          metadata
        })
        .select()
        .maybeSingle()

      if (error) throw error
      if (!data) throw new Error('Failed to insert analytics data')
      return data
    } catch (error) {
      console.error('Error inserting analytics data:', error)
      throw error
    }
  }

  // Generate sample data for demo purposes
  // DISABLED - Analytics must use ONLY real event-based tracking
  /*
  async generateSampleData() {
    if (!this.currentCompanyId) return

    const sampleData = []
    const today = new Date()
    
    // Generate last 30 days of sample data
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]

      // Revenue data
      sampleData.push({
        company_id: this.currentCompanyId,
        metric_type: 'revenue',
        metric_value: Math.floor(Math.random() * 5000) + 2000,
        metric_date: dateStr,
        metadata: { source: 'sample' }
      })

      // Users data
      sampleData.push({
        company_id: this.currentCompanyId,
        metric_type: 'users',
        metric_value: Math.floor(Math.random() * 200) + 100,
        metric_date: dateStr,
        metadata: { source: 'sample' }
      })

      // Orders data
      sampleData.push({
        company_id: this.currentCompanyId,
        metric_type: 'orders',
        metric_value: Math.floor(Math.random() * 50) + 10,
        metric_date: dateStr,
        metadata: { source: 'sample' }
      })
    }

    // Add conversion rate
    sampleData.push({
      company_id: this.currentCompanyId,
      metric_type: 'conversion_rate',
      metric_value: (Math.random() * 5 + 1).toFixed(2),
      metric_date: today.toISOString().split('T')[0],
      metadata: { source: 'sample' }
    })

    try {
      const { data, error } = await supabase
        .from('analytics_data')
        .insert(sampleData)
        .select()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error generating sample data:', error)
      throw error
    }
  }
  */
}

export const analyticsApi = new AnalyticsApiService()
export default analyticsApi
