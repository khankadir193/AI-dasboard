import KPICard from '../../../../components/ui/KPICard'
import { LogIn, PlusCircle, Trash2, LayoutDashboard, RefreshCw } from 'lucide-react'
import { memo } from 'react'

const KPISection = memo(({ kpiData = {} }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
      <KPICard
        title="Active Users"
        value={(Number(kpiData.activeUsers) || 0).toLocaleString()}
        change={0}
        changeLabel="last 30 days"
        icon={LogIn}
        color="blue"
      />
      <KPICard
        title="Projects Created"
        value={(Number(kpiData.projectsCreated) || 0).toLocaleString()}
        change={0}
        changeLabel="last 30 days"
        icon={PlusCircle}
        color="green"
      />
      <KPICard
        title="Projects Deleted"
        value={(Number(kpiData.projectsDeleted) || 0).toLocaleString()}
        change={0}
        changeLabel="last 30 days"
        icon={Trash2}
        color="red"
      />
      <KPICard
        title="Dashboard Views"
        value={(Number(kpiData.dashboardViews) || 0).toLocaleString()}
        change={0}
        changeLabel="last 30 days"
        icon={LayoutDashboard}
        color="purple"
      />
      <KPICard
        title="Projects Updated"
        value={(Number(kpiData.projectsUpdated) || 0).toLocaleString()}
        change={0}
        changeLabel="last 30 days"
        icon={RefreshCw}
        color="orange"
      />
    </div>
  )
})

export default KPISection

