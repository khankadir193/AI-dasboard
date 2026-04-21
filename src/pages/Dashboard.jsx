import { Users, DollarSign, TrendingUp, ShoppingCart } from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts'
import KPICard from '../components/ui/KPICard'
import { generateRevenueData, generateCategoryData, formatCurrency } from '../utils/mockData'
import { useTodos } from '../hooks/useFetch'

const revenueData = generateRevenueData(14)
const categoryData = generateCategoryData()

export default function Dashboard() {
  const { data: todos, isLoading } = useTodos()

  const completedCount = todos?.filter(t => t.completed).length || 0
  const totalCount = todos?.length || 0

  return (
    <div className="space-y-6 stagger">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KPICard
          title="Total Revenue"
          value="$84,250"
          change={12.5}
          changeLabel="vs last month"
          icon={DollarSign}
          color="blue"
        />
        <KPICard
          title="Active Users"
          value="12,430"
          change={8.2}
          changeLabel="vs last month"
          icon={Users}
          color="green"
        />
        <KPICard
          title="Conversion Rate"
          value="3.6%"
          change={-1.4}
          changeLabel="vs last month"
          icon={TrendingUp}
          color="purple"
        />
        <KPICard
          title="New Orders"
          value="1,893"
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
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={revenueData}>
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
        </div>

        {/* Pie Chart */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-1">Revenue by Plan</h2>
          <p className="text-sm text-gray-500 mb-4">This month</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={categoryData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                {categoryData.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip formatter={value => [`$${value.toLocaleString()}`, 'Revenue']} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {categoryData.map(item => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }} />
                  <span className="text-sm text-gray-600 dark:text-gray-400">{item.name}</span>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  ${item.value.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
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
                <span className={`text-sm flex-1 ${
                  todo.completed ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-300'
                }`}>
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
