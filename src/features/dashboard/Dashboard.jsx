import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Loader2 } from 'lucide-react'

// Local imports
import { useAnalytics } from './hooks/useAnalytics'
import { useTrial } from './hooks/useTrial'
import KPISection from './components/KPI/KPISection'
import RevenueChart from './components/Charts/RevenueChart'
import UsersChart from './components/Charts/UsersChart'
import ProjectStatusChart from './components/Charts/ProjectStatusChart'
import TasksList from './components/Tasks/TasksList'

export default function Dashboard() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { user, loading: isAuthLoading } = useSelector((state) => state.auth)
  const { profile } = useSelector((state) => state.profile)
  
  const [loading, setLoading] = useState(true)
  const [todos, setTodos] = useState([])
  
  // Hooks for extracted logic
  const { analyticsData } = useAnalytics()
  const { trialInfo } = useTrial()
  
  const tabs = [
    { to: '/dashboard', label: 'Overview' },
    { to: '/dashboard/analytics', label: 'Analytics' },
    { to: '/dashboard/ai-insights', label: 'AI Insights' },
    { to: '/dashboard/data-table', label: 'Data Table' },
    { to: '/dashboard/settings', label: 'Settings' },
  ]

  useEffect(() => {
    if (!isAuthLoading && !user) {
      navigate('/signin', { replace: true })
    }
  }, [isAuthLoading, user, navigate])

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

      {/* KPI Section */}
      <KPISection kpiData={analyticsData.kpiData} />

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <RevenueChart 
          data={analyticsData.revenueData} 
          loading={analyticsData.isLoading} 
          error={analyticsData.error} 
        />
        <ProjectStatusChart 
          data={analyticsData.projectStatusData} 
          loading={analyticsData.isLoading} 
          error={analyticsData.error} 
        />
      </div>

      {/* Users Chart */}
      <UsersChart 
        data={analyticsData.usersData} 
        loading={analyticsData.isLoading} 
        error={analyticsData.error} 
      />

      {/* Tasks */}
      <TasksList 
        todos={todos} 
        loading={loading} 
        completedCount={completedCount}
        totalCount={totalCount} 
      />
    </div>
  )
}

