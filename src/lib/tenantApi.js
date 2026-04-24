import { supabase } from './supabaseClient'

// Tenant-aware API service that automatically filters by tenant_id
class TenantApiService {
  constructor() {
    this.currentTenantId = null
  }

  // Set current tenant ID (called after authentication)
  setTenantId(tenantId) {
    this.currentTenantId = tenantId
  }

  // Get current tenant ID
  getTenantId() {
    return this.currentTenantId
  }

  // Generic method to add tenant filter to any query
  addTenantFilter(query, tableName) {
    if (!this.currentTenantId) {
      throw new Error('Tenant ID not set. Please authenticate first.')
    }
    
    return query.eq('tenant_id', this.currentTenantId)
  }

  // Analytics API methods
  async getAnalytics() {
    if (!this.currentTenantId) {
      // Return mock data for demo purposes
      return [
        { id: '1', metric_name: 'total_users', value: 12430, created_at: new Date().toISOString() },
        { id: '2', metric_name: 'completed_tasks', value: 89, created_at: new Date().toISOString() },
        { id: '3', metric_name: 'total_tasks', value: 156, created_at: new Date().toISOString() }
      ]
    }

    try {
      let query = supabase.from('analytics').select('*')
      query = this.addTenantFilter(query, 'analytics')
      
      const { data, error } = await query.orderBy('created_at', { ascending: false })
      
      if (error) throw error
      return data
    } catch (error) {
      console.warn('Analytics table not found, returning mock data:', error.message)
      // Return mock data for demo purposes
      return [
        { id: '1', metric_name: 'total_users', value: 12430, created_at: new Date().toISOString() },
        { id: '2', metric_name: 'completed_tasks', value: 89, created_at: new Date().toISOString() },
        { id: '3', metric_name: 'total_tasks', value: 156, created_at: new Date().toISOString() }
      ]
    }
  }

  async createAnalytics(analyticsData) {
    if (!this.currentTenantId) {
      throw new Error('Tenant ID not set')
    }

    try {
      const { data, error } = await supabase
        .from('analytics')
        .insert({
          ...analyticsData,
          tenant_id: this.currentTenantId
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.warn('Failed to create analytics, table may not exist:', error.message)
      // Return mock data for demo purposes
      return {
        id: Date.now().toString(),
        ...analyticsData,
        tenant_id: this.currentTenantId,
        created_at: new Date().toISOString()
      }
    }
  }

  // KPIs API methods
  async getKpis() {
    if (!this.currentTenantId) {
      // Return mock data for demo purposes
      return [
        { id: '1', title: 'Total Revenue', value: 84250, change: 12.5, trend: 'up', created_at: new Date().toISOString() },
        { id: '2', title: 'Active Users', value: 12430, change: 8.2, trend: 'up', created_at: new Date().toISOString() },
        { id: '3', title: 'Conversion Rate', value: 3.6, change: -1.4, trend: 'down', created_at: new Date().toISOString() },
        { id: '4', title: 'New Orders', value: 1893, change: 5.7, trend: 'up', created_at: new Date().toISOString() }
      ]
    }

    try {
      let query = supabase.from('kpis').select('*')
      query = this.addTenantFilter(query, 'kpis')
      
      const { data, error } = await query.orderBy('created_at', { ascending: false })
      
      if (error) throw error
      return data
    } catch (error) {
      console.warn('KPIs table not found, returning mock data:', error.message)
      // Return mock data for demo purposes
      return [
        { id: '1', title: 'Total Revenue', value: 84250, change: 12.5, trend: 'up', created_at: new Date().toISOString() },
        { id: '2', title: 'Active Users', value: 12430, change: 8.2, trend: 'up', created_at: new Date().toISOString() },
        { id: '3', title: 'Conversion Rate', value: 3.6, change: -1.4, trend: 'down', created_at: new Date().toISOString() },
        { id: '4', title: 'New Orders', value: 1893, change: 5.7, trend: 'up', created_at: new Date().toISOString() }
      ]
    }
  }

  async createKpi(kpiData) {
    const { data, error } = await supabase
      .from('kpis')
      .insert({
        ...kpiData,
        tenant_id: this.currentTenantId
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async updateKpi(kpiId, updates) {
    let query = supabase
      .from('kpis')
      .update(updates)
      .eq('id', kpiId)
    
    query = this.addTenantFilter(query, 'kpis')
    
    const { data, error } = await query.select().single()
    
    if (error) throw error
    return data
  }

  // AI Insights API methods
  async getAiInsights() {
    let query = supabase
      .from('ai_insights')
      .select(`
        *,
        profiles!ai_insights_user_id_fkey (
          first_name,
          last_name
        )
      `)
    
    query = this.addTenantFilter(query, 'ai_insights')
    
    const { data, error } = await query.orderBy('created_at', { ascending: false })
    
    if (error) throw error
    return data
  }

  async createAiInsight(insightData, userId) {
    const { data, error } = await supabase
      .from('ai_insights')
      .insert({
        ...insightData,
        tenant_id: this.currentTenantId,
        user_id: userId
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Data Tables API methods
  async getDataTables() {
    let query = supabase
      .from('data_tables')
      .select(`
        *,
        profiles:data_tables_created_by_fkey (
          first_name,
          last_name
        )
      `)
    
    query = this.addTenantFilter(query, 'data_tables')
    
    const { data, error } = await query.orderBy('created_at', { ascending: false })
    
    if (error) throw error
    return data
  }

  async createDataTable(tableData, userId) {
    const { data, error } = await supabase
      .from('data_tables')
      .insert({
        ...tableData,
        tenant_id: this.currentTenantId,
        created_by: userId
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async updateDataTable(tableId, updates, userId) {
    let query = supabase
      .from('data_tables')
      .update(updates)
      .eq('id', tableId)
      .eq('created_by', userId) // Only creator can update
    
    query = this.addTenantFilter(query, 'data_tables')
    
    const { data, error } = await query.select().single()
    
    if (error) throw error
    return data
  }

  async deleteDataTable(tableId, userId) {
    let query = supabase
      .from('data_tables')
      .delete()
      .eq('id', tableId)
      .eq('created_by', userId) // Only creator can delete
    
    query = this.addTenantFilter(query, 'data_tables')
    
    const { error } = await query
    
    if (error) throw error
    return true
  }

  // Tenant management methods
  async getTenantDetails() {
    if (!this.currentTenantId) {
      throw new Error('Tenant ID not set')
    }

    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', this.currentTenantId)
      .single()

    if (error) throw error
    return data
  }

  async updateTenantSettings(settings) {
    if (!this.currentTenantId) {
      throw new Error('Tenant ID not set')
    }

    const { data, error } = await supabase
      .from('tenants')
      .update({ settings })
      .eq('id', this.currentTenantId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // User management methods (for admins)
  async getTenantUsers() {
    if (!this.currentTenantId) {
      throw new Error('Tenant ID not set')
    }

    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        auth.users!profiles_id_fkey (
          email,
          created_at
        )
      `)
      .eq('tenant_id', this.currentTenantId)

    if (error) throw error
    return data
  }

  async updateUserRole(userId, role) {
    if (!this.currentTenantId) {
      throw new Error('Tenant ID not set')
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', userId)
      .eq('tenant_id', this.currentTenantId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Clear tenant data (for logout)
  clearTenant() {
    this.currentTenantId = null
  }
}

// Create singleton instance
export const tenantApi = new TenantApiService()

// Hook for components to use tenant API
export function useTenantApi() {
  return tenantApi
}
