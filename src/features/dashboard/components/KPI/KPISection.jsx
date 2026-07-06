import KPICard from '../../../../components/ui/KPICard'
import { LogIn, PlusCircle, Trash2, LayoutDashboard, RefreshCw } from 'lucide-react'
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

const KPISection = memo(({ kpiData = {}, growthData = {}, dateLabel }) => {
  const changeLabel = useMemo(() => getChangeLabel(dateLabel), [dateLabel])

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

