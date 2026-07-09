import { supabase } from '../lib/supabaseClient'

const EMPTY_KPI = {
  activeUsers: 0,
  projectsCreated: 0,
  projectsDeleted: 0,
  dashboardViews: 0,
  projectsUpdated: 0
}

class AnalyticsService {
  constructor() {
    this.currentCompanyId = null
  }

  setCompanyId(companyId) {
    this.currentCompanyId = companyId
  }

  getCompanyId() {
    return this.currentCompanyId
  }

  _requireCompany() {
    if (!this.currentCompanyId) {
      throw new Error('Company ID not set. Please authenticate first.')
    }
  }

  async _fetchRawData(startDate, endDate) {
    this._requireCompany()
    const { data, error } = await supabase
      .from('analytics_data')
      .select('*')
      .eq('company_id', this.currentCompanyId)
      .gte('metric_date', startDate)
      .lte('metric_date', endDate)
      .order('metric_date', { ascending: true })

    if (error) throw error
    return data || []
  }

  _aggregateKPI(rows) {
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

  _computeGrowth(curr, prev) {
    return prev === 0 ? 0 : Math.round(((curr - prev) / prev) * 100)
  }

  _buildTimeline(rows) {
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

  _extractRecentActivity(rawData, limit = 10) {
    return [...rawData]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, limit)
  }

  async getKpiMetrics(startDate, endDate) {
    const rows = await this._fetchRawData(startDate, endDate)
    return this._aggregateKPI(rows)
  }

  async getGrowthMetrics(startDate, endDate) {
    const rangeMs = new Date(endDate) - new Date(startDate)
    const prevEnd = new Date(new Date(startDate).getTime() - 86400000)
    const prevStart = new Date(prevEnd.getTime() - rangeMs)
    const fmt = d => d.toISOString().split('T')[0]

    const [currentRows, previousRows] = await Promise.all([
      this._fetchRawData(startDate, endDate),
      this._fetchRawData(fmt(prevStart), fmt(prevEnd))
    ])

    const currKpi = this._aggregateKPI(currentRows)
    const prevKpi = this._aggregateKPI(previousRows)

    return {
      activeUsers: this._computeGrowth(currKpi.activeUsers, prevKpi.activeUsers),
      projectsCreated: this._computeGrowth(currKpi.projectsCreated, prevKpi.projectsCreated),
      projectsDeleted: this._computeGrowth(currKpi.projectsDeleted, prevKpi.projectsDeleted),
      dashboardViews: this._computeGrowth(currKpi.dashboardViews, prevKpi.dashboardViews),
      projectsUpdated: this._computeGrowth(currKpi.projectsUpdated, prevKpi.projectsUpdated)
    }
  }

  async getActivityTimeline(startDate, endDate) {
    const rows = await this._fetchRawData(startDate, endDate)
    return this._buildTimeline(rows)
  }

  async getRecentActivity(startDate, endDate, limit = 10) {
    this._requireCompany()

    if (typeof startDate === 'number') {
      limit = startDate
      startDate = null
      endDate = null
    }

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
  }

  async getEventDistribution(startDate, endDate) {
    const rows = await this._fetchRawData(startDate, endDate)
    const kpi = this._aggregateKPI(rows)

    const distribution = [
      { name: 'Dashboard Views', value: kpi.dashboardViews },
      { name: 'User Logins', value: kpi.activeUsers },
      { name: 'Projects Updated', value: kpi.projectsUpdated },
      { name: 'Projects Created', value: kpi.projectsCreated },
      { name: 'Projects Deleted', value: kpi.projectsDeleted }
    ].filter(item => item.value > 0).sort((a, b) => b.value - a.value)

    return distribution
  }

  async getProjectStatus() {
    this._requireCompany()

    const { data: projects, error } = await supabase
      .from('projects')
      .select('status')
      .eq('company_id', this.currentCompanyId)

    if (error) throw error

    const statusCounts = projects?.reduce((acc, project) => {
      acc[project.status] = (acc[project.status] || 0) + 1
      return acc
    }, {}) || {}

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
  }

  async getMostActiveEvent(startDate, endDate) {
    const rows = await this._fetchRawData(startDate, endDate)
    const kpi = this._aggregateKPI(rows)

    const entries = [
      { key: 'active_users', title: 'User Login', count: kpi.activeUsers },
      { key: 'projects_created', title: 'Project Created', count: kpi.projectsCreated },
      { key: 'projects_updated', title: 'Project Updated', count: kpi.projectsUpdated },
      { key: 'projects_deleted', title: 'Project Deleted', count: kpi.projectsDeleted },
      { key: 'dashboard_view', title: 'Dashboard View', count: kpi.dashboardViews }
    ]

    if (!entries.length) return { title: null, count: 0, subtitle: null }

    const max = entries.reduce((a, b) => (b.count > a.count ? b : a), entries[0])
    if (!max || max.count <= 0) {
      return { title: null, count: 0, subtitle: 'No Activity Yet' }
    }

    return {
      title: max.title,
      count: max.count,
      subtitle: 'events tracked'
    }
  }

  async getTotalEvents(startDate, endDate) {
    const rows = await this._fetchRawData(startDate, endDate)
    const kpi = this._aggregateKPI(rows)
    return (kpi.activeUsers || 0) +
      (kpi.projectsCreated || 0) +
      (kpi.projectsUpdated || 0) +
      (kpi.projectsDeleted || 0) +
      (kpi.dashboardViews || 0)
  }

  async getAverageDailyEvents(startDate, endDate) {
    const total = await this.getTotalEvents(startDate, endDate)
    const start = new Date(startDate)
    const end = new Date(endDate)
    const daysInRange = Math.max(1, Math.round((end - start) / 86400000) + 1)
    return Math.round(total / daysInRange)
  }

  async getAllDashboardData(startDate, endDate) {
    this._requireCompany()
    const rangeMs = new Date(endDate) - new Date(startDate)
    const prevEnd = new Date(new Date(startDate).getTime() - 86400000)
    const prevStart = new Date(prevEnd.getTime() - rangeMs)
    const fmt = d => d.toISOString().split('T')[0]

    const [rawData, previousData, projectStatusData] = await Promise.all([
      this._fetchRawData(startDate, endDate),
      this._fetchRawData(fmt(prevStart), fmt(prevEnd)),
      this.getProjectStatus()
    ])

    const kpiData = this._aggregateKPI(rawData)
    const prevKpi = this._aggregateKPI(previousData)
    const growthData = {
      activeUsers: this._computeGrowth(kpiData.activeUsers, prevKpi.activeUsers),
      projectsCreated: this._computeGrowth(kpiData.projectsCreated, prevKpi.projectsCreated),
      projectsDeleted: this._computeGrowth(kpiData.projectsDeleted, prevKpi.projectsDeleted),
      dashboardViews: this._computeGrowth(kpiData.dashboardViews, prevKpi.dashboardViews),
      projectsUpdated: this._computeGrowth(kpiData.projectsUpdated, prevKpi.projectsUpdated)
    }
    const activityTimelineData = this._buildTimeline(rawData)
    const recentActivity = this._extractRecentActivity(rawData, 10)

    return {
      kpiData,
      growthData,
      activityTimelineData,
      projectStatusData,
      recentActivity
    }
  }

  async getAllAnalyticsPageData(startDate, endDate) {
    this._requireCompany()
    const rawData = await this._fetchRawData(startDate, endDate)

    const kpiData = this._aggregateKPI(rawData)
    const timelineData = this._buildTimeline(rawData)

    const allEvents = rawData.map(item => ({
      ...item,
      label: item.metric_type,
      metric_key: item.metric_type
    }))

    // Most active event (local computation, 0 queries)
    const entries = [
      { key: 'active_users', title: 'User Login', count: kpiData.activeUsers },
      { key: 'projects_created', title: 'Project Created', count: kpiData.projectsCreated },
      { key: 'projects_updated', title: 'Project Updated', count: kpiData.projectsUpdated },
      { key: 'projects_deleted', title: 'Project Deleted', count: kpiData.projectsDeleted },
      { key: 'dashboard_view', title: 'Dashboard View', count: kpiData.dashboardViews }
    ]
    const max = entries.reduce((a, b) => (b.count > a.count ? b : a), entries[0])
    const mostActiveEvent = (!max || max.count <= 0)
      ? { title: null, count: 0, subtitle: 'No Activity Yet' }
      : { title: max.title, count: max.count, subtitle: 'events tracked' }

    // Total events (local computation, 0 queries)
    const totalEventsTracked = (kpiData.activeUsers || 0) +
      (kpiData.projectsCreated || 0) +
      (kpiData.projectsUpdated || 0) +
      (kpiData.projectsDeleted || 0) +
      (kpiData.dashboardViews || 0)

    // Avg daily events (local computation, 0 queries)
    const start = new Date(startDate)
    const end = new Date(endDate)
    const daysInRange = Math.max(1, Math.round((end - start) / 86400000) + 1)
    const averageDailyEvents = Math.round(totalEventsTracked / daysInRange)

    // Latest activity (local computation, 0 queries)
    let latestActivity = null
    if (allEvents.length > 0) {
      const sorted = [...allEvents].sort((a, b) => {
        const at = a?.created_at || a?.metric_date
        const bt = b?.created_at || b?.metric_date
        return (bt ? new Date(bt).getTime() : 0) - (at ? new Date(at).getTime() : 0)
      })
      const latest = sorted[0]
      if (latest) {
        const createdAt = latest?.created_at || latest?.metric_date
        const dt = createdAt ? new Date(createdAt) : null
        if (dt && !Number.isNaN(dt.getTime())) {
          const now = Date.now()
          const diffMs = Math.max(0, now - dt.getTime())
          const mins = Math.floor(diffMs / 60000)
          const hours = Math.floor(mins / 60)
          const days = Math.floor(hours / 24)
          let timeAgo = 'just now'
          if (days > 0) timeAgo = `${days}d ago`
          else if (hours > 0) timeAgo = `${hours}h ago`
          else if (mins > 0) timeAgo = `${mins} mins ago`
          latestActivity = {
            label: latest.label || 'Activity',
            timeAgo,
            metric_key: latest.metric_key || 'active_users'
          }
        }
      }
    }

    return {
      eventCounts: kpiData,
      allEvents,
      timelineData,
      mostActiveEvent,
      latestActivity,
      totalEventsTracked,
      averageDailyEvents
    }
  }

  async fetchEventsByTypes(allowedTypes) {
    this._requireCompany()

    const { data, error } = await supabase
      .from('analytics_data')
      .select('*')
      .eq('company_id', this.currentCompanyId)
      .in('metric_type', allowedTypes)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }
}

export const analyticsService = new AnalyticsService()
export default analyticsService
