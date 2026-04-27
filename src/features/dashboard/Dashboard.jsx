import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Users, DollarSign, TrendingUp, ShoppingCart } from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts'
import KPICard from '../../components/ui/KPICard'
import { formatCurrency } from '../../utils/mockData'
import { Loader2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabaseClient'
import { analyticsApi } from '../../lib/analyticsApi'

export default function Dashboard() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { session, isLoading: isAuthLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [todos, setTodos] = useState([])
  const [trialInfo, setTrialInfo] = useState({
    isLoading: true,
    trialEnd: null,
    daysLeft: null,
    isExpired: false,
  })
  
  // Analytics data state
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

  const tabs = [
    { to: '/dashboard', label: 'Overview' },
    { to: '/dashboard/analytics', label: 'Analytics' },
    { to: '/dashboard/ai-insights', label: 'AI Insights' },
    { to: '/dashboard/data-table', label: 'Data Table' },
    { to: '/dashboard/settings', label: 'Settings' },
  ]

  useEffect(() => {
    if (!isAuthLoading && !session) {
      navigate('/signin', { replace: true })
    }
  }, [isAuthLoading, session, navigate])

  useEffect(() => {
    const fetchTrialInfo = async () => {
      if (!session?.user?.id) {
        setTrialInfo({
          isLoading: false,
          trialEnd: null,
          daysLeft: null,
          isExpired: false,
        })
        return
      }

      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('company_id')
          .eq('id', session.user.id)
          .maybeSingle()

        if (profileError || !profile?.company_id) {
          setTrialInfo({
            isLoading: false,
            trialEnd: null,
            daysLeft: null,
            isExpired: false,
          })
          return
        }

        const { data: company, error: companyError } = await supabase
          .from('companies')
          .select('id, name, created_at')
          .eq('id', profile.company_id)
          .maybeSingle()

        if (companyError || !company?.created_at) {
          setTrialInfo({
            isLoading: false,
            trialEnd: null,
            daysLeft: null,
            isExpired: false,
          })
          return
        }

        // Calculate trial period based on company creation date (30-day trial)
        const now = new Date()
        const createdDate = new Date(company.created_at)
        const trialEndDate = new Date(createdDate.getTime() + (30 * 24 * 60 * 60 * 1000)) // 30 days from creation
        const diffMs = trialEndDate.getTime() - now.getTime()
        const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

        setTrialInfo({
          isLoading: false,
          trialEnd: trialEndDate,
          daysLeft: Math.max(daysLeft, 0),
          isExpired: diffMs <= 0,
        })
      } catch (_error) {
        setTrialInfo({
          isLoading: false,
          trialEnd: null,
          daysLeft: null,
          isExpired: false,
        })
      }
    }

    fetchTrialInfo()
  }, [session])

  // Analytics data fetching
  const fetchAnalyticsData = async () => {
    if (!session?.user?.id) {
      // Reset analytics state when no session to prevent stale data
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
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', session.user.id)
        .maybeSingle()

      if (profileError || !profile?.company_id) {
        throw new Error('Company not found')
      }

      // Set company ID in analytics API
      analyticsApi.setCompanyId(profile.company_id)

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
    fetchAnalyticsData()
  }, [session])

  useEffect(() => {
    // Simulate loading for todos
    const timer = setTimeout(() => {
      setLoading(false)
      // Mock todos data
      setTodos([
        { id: 1, title: 'Review Q3 financial reports', completed: true, userId: 1 },
        { id: 2, title: 'Update team on project status', completed: false, userId: 1 },
        { id: 3, title: 'Prepare presentation slides', completed: false, userId: 2 },
        { id: 4, title: 'Schedule client meeting', completed: true, userId: 2 },
        { id: 5, title: 'Review code changes', completed: false, userId: 3 },
        { id: 6, title: 'Update documentation', completed: true, userId: 3 },
      ])
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  const isLoading = loading
  const completedCount = todos?.filter(t => t.completed).length || 0
  const totalCount = todos?.length || 0

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="animate-spin h-8 w-8 text-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 stagger">
      {!trialInfo.isLoading && trialInfo.trialEnd && (
        <div
          className={`rounded-xl border px-4 py-3 ${
            trialInfo.isExpired
              ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300'
              : 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300'
          }`}
        >
          {trialInfo.isExpired
            ? 'Your 30-day trial has ended. Upgrade to keep full access.'
            : `Trial active: ${trialInfo.daysLeft} day${trialInfo.daysLeft === 1 ? '' : 's'} remaining.`}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const isActive = pathname === tab.to
          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {tab.label}
            </Link>
          )
        })}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KPICard
          title="Total Revenue"
          value={formatCurrency(analyticsData.kpiData.totalRevenue)}
          change={12.5}
          changeLabel="vs last month"
          icon={DollarSign}
          color="blue"
        />
        <KPICard
          title="Active Users"
          value={analyticsData.kpiData.activeUsers.toLocaleString()}
          change={8.2}
          changeLabel="vs last month"
          icon={Users}
          color="green"
        />
        <KPICard
          title="Conversion Rate"
          value={`${analyticsData.kpiData.conversionRate}%`}
          change={-1.4}
          changeLabel="vs last month"
          icon={TrendingUp}
          color="purple"
        />
        <KPICard
          title="New Orders"
          value={analyticsData.kpiData.newOrders.toLocaleString()}
          change={5.7}
          changeLabel="vs last month"
          icon={ShoppingCart}
          color="orange"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Revenue Area Chart */}
        <div className="card xl:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">Revenue Overview</h2>
              <p className="text-sm text-gray-500 mt-0.5">Last 14 days</p>
            </div>
            <select className="text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg px-3 py-1.5 border-0 outline-none">
              <option>Last 14 days</option>
              <option>Last 30 days</option>
              <option>Last 90 days</option>
            </select>
          </div>
          {analyticsData.isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
            </div>
          ) : analyticsData.error ? (
            <div className="flex items-center justify-center h-64 text-red-600">
              <p>Error loading revenue data</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={analyticsData.revenueData}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" className="dark:stroke-gray-800" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis tickFormatter={v => `$${v / 1000}k`} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <Tooltip formatter={value => [formatCurrency(value), 'Revenue']} />
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} fill="url(#revGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Project Status Pie Chart */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-1">Project Status</h2>
          <p className="text-sm text-gray-500 mb-4">Current distribution</p>
          {analyticsData.isLoading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="animate-spin h-6 w-6 text-blue-600" />
            </div>
          ) : analyticsData.error ? (
            <div className="flex items-center justify-center h-48 text-red-600">
              <p>Error loading project data</p>
            </div>
          ) : analyticsData.projectStatusData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-500">
              <p>No projects found</p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie 
                    data={analyticsData.projectStatusData} 
                    cx="50%" 
                    cy="50%" 
                    innerRadius={55} 
                    outerRadius={80} 
                    paddingAngle={3} 
                    dataKey="value"
                  >
                    {analyticsData.projectStatusData.map((entry, index) => (
                      <Cell key={index} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={value => [value, 'Projects']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {analyticsData.projectStatusData.map(item => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }} />
                      <span className="text-sm text-gray-600 dark:text-gray-400">{item.name}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Users Line Chart */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">User Growth</h2>
            <p className="text-sm text-gray-500 mt-0.5">Last 14 days</p>
          </div>
          <select className="text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg px-3 py-1.5 border-0 outline-none">
            <option>Last 14 days</option>
            <option>Last 30 days</option>
            <option>Last 90 days</option>
          </select>
        </div>
        {analyticsData.isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
          </div>
        ) : analyticsData.error ? (
          <div className="flex items-center justify-center h-64 text-red-600">
            <p>Error loading user data</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={analyticsData.usersData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" className="dark:stroke-gray-800" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
              <Tooltip formatter={value => [value.toLocaleString(), 'Users']} />
              <Line 
                type="monotone" 
                dataKey="users" 
                stroke="#10b981" 
                strokeWidth={2}
                dot={{ fill: '#10b981', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Recent Tasks (from REST API) */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">Recent Tasks</h2>
            <p className="text-sm text-gray-500">
              {isLoading ? 'Loading...' : `${completedCount} of ${totalCount} completed`}
            </p>
          </div>
          <span className="text-xs bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-medium px-2.5 py-1 rounded-full">
            Live API
          </span>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {todos?.slice(0, 6).map(todo => (
              <div
                key={todo.id}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  todo.completed
                    ? 'bg-green-500 border-green-500'
                    : 'border-gray-300 dark:border-gray-600'
                }`}>
                  {todo.completed && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className={`text-sm flex-1 ${todo.completed ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>
                  {todo.title}
                </span>
                <span className="text-xs text-gray-400">User #{todo.userId}</span>
              </div>
            ))}
          </div>
        )}
        </div>
    </div>
  )
}
