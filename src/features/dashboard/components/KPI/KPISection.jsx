import KPICard from '../../../../components/ui/KPICard'
import { Users, DollarSign, TrendingUp, ShoppingCart } from 'lucide-react'
import { formatCurrency } from '../../../../utils/mockData'

const KPISection = ({ kpiData }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <KPICard
        title="Total Revenue"
        value={formatCurrency(kpiData.totalRevenue)}
        change={12.5}
        changeLabel="vs last month"
        icon={DollarSign}
        color="blue"
      />
      <KPICard
        title="Active Users"
        value={kpiData.activeUsers.toLocaleString()}
        change={8.2}
        changeLabel="vs last month"
        icon={Users}
        color="green"
      />
      <KPICard
        title="Conversion Rate"
        value={`${kpiData.conversionRate}%`}
        change={-1.4}
        changeLabel="vs last month"
        icon={TrendingUp}
        color="purple"
      />
      <KPICard
        title="New Orders"
        value={kpiData.newOrders.toLocaleString()}
        change={5.7}
        changeLabel="vs last month"
        icon={ShoppingCart}
        color="orange"
      />
    </div>
  )
}

export default KPISection

