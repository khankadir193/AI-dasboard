import KPICard from '../../../../components/ui/KPICard'
import { LogIn, PlusCircle, Trash2, LayoutDashboard, RefreshCw, Loader2, RotateCcw } from 'lucide-react'
import { memo, useMemo } from 'react'

function getChangeLabel(label) {
  switch (label) {
    case 'Today': return 'vs yesterday'
    case 'Last 7 Days': return 'vs previous 7 days'
    case 'Last 30 Days': return 'vs previous 30 days'
    case 'Last 90 Days': return 'vs previous 90 days'
    default: return 'vs previous period'
  }
}

function SkeletonCard() {
  return (
    <div className="card animate-pulse">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" />
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16 mt-2" />
        </div>
        <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-gray-700" />
      </div>
      <div className="flex items-center gap-1.5 mt-4">
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-full w-12" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" />
      </div>
    </div>
  )
}

const KPISection = memo(({ kpiData = {}, growthData = {}, dateLabel, loading = false, error = null, onRetry }) => {
  const changeLabel = useMemo(() => getChangeLabel(dateLabel), [dateLabel])

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => <SkeletonCard key={i} />)}
      </div>
    )
  }

  if (error) {
    return (
      <div className="card p-6 text-center">
        <p className="text-red-600 dark:text-red-400 mb-3">Failed to load KPI data</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RotateCcw size={16} />
            Retry
          </button>
        )}
      </div>
    )
  }

  const hasData = (kpiData.activeUsers || kpiData.projectsCreated || kpiData.projectsDeleted || kpiData.dashboardViews || kpiData.projectsUpdated) > 0

  if (!hasData) {
    return (
      <div className="card p-6 text-center">
        <p className="text-gray-500 dark:text-gray-400">No KPI data available yet. Start using the app to generate analytics.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
      <KPICard
        title="User Logins"
        value={(Number(kpiData.activeUsers) || 0).toLocaleString()}
        change={growthData.activeUsers ?? 0}
        changeLabel={changeLabel}
        icon={LogIn}
        color="blue"
      />
      <KPICard
        title="Projects Created"
        value={(Number(kpiData.projectsCreated) || 0).toLocaleString()}
        change={growthData.projectsCreated ?? 0}
        changeLabel={changeLabel}
        icon={PlusCircle}
        color="green"
      />
      <KPICard
        title="Projects Deleted"
        value={(Number(kpiData.projectsDeleted) || 0).toLocaleString()}
        change={growthData.projectsDeleted ?? 0}
        changeLabel={changeLabel}
        icon={Trash2}
        color="red"
      />
      <KPICard
        title="Dashboard Views"
        value={(Number(kpiData.dashboardViews) || 0).toLocaleString()}
        change={growthData.dashboardViews ?? 0}
        changeLabel={changeLabel}
        icon={LayoutDashboard}
        color="purple"
      />
      <KPICard
        title="Projects Updated"
        value={(Number(kpiData.projectsUpdated) || 0).toLocaleString()}
        change={growthData.projectsUpdated ?? 0}
        changeLabel={changeLabel}
        icon={RefreshCw}
        color="orange"
      />
    </div>
  )
})

export default KPISection

