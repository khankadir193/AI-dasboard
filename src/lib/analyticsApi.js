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
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 30) // Last 30 days

      const { data, error } = await supabase
        .from('analytics_data')
        .select('*')
        .eq('company_id', this.currentCompanyId)
        .gte('metric_date', startDate.toISOString().split('T')[0])
        .lte('metric_date', endDate.toISOString().split('T')[0])

      if (error) throw error

      // Calculate KPIs
      const kpis = {
        totalRevenue: 0,
        activeUsers: 0,
        conversionRate: 0,
        newOrders: 0
      }

      data?.forEach(item => {
        switch (item.metric_type) {
          case 'revenue':
            kpis.totalRevenue += parseFloat(item.metric_value ?? 0)
            break
          case 'users':
            kpis.activeUsers = Math.max(kpis.activeUsers, parseInt(item.metric_value ?? 0))
            break
          case 'conversion_rate':
            kpis.conversionRate = parseFloat(item.metric_value ?? 0)
            break
          case 'orders':
            kpis.newOrders += parseInt(item.metric_value ?? 0)
            break
        }
      })

      return kpis
    } catch (error) {
      console.error('Error fetching KPI data:', error)
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
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error inserting analytics data:', error)
      throw error
    }
  }

  // Generate sample data for demo purposes
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
}

export const analyticsApi = new AnalyticsApiService()
export default analyticsApi
