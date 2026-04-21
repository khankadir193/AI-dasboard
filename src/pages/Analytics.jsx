import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { generateUserData, generateRevenueData, formatCurrency } from '../utils/mockData'

const userData = generateUserData(12)
const revenueData = generateRevenueData(30)

export default function Analytics() {
  return (
    <div className="space-y-6 stagger">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* User Growth Line Chart */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-1">User Growth</h2>
          <p className="text-sm text-gray-500 mb-6">Monthly active vs new users</p>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={userData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={2} dot={false} name="Total Users" />
              <Line type="monotone" dataKey="newUsers" stroke="#10b981" strokeWidth={2} dot={false} name="New Users" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue vs Expenses Bar Chart */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-1">Revenue vs Expenses</h2>
          <p className="text-sm text-gray-500 mb-6">Last 14 days comparison</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={revenueData.slice(-14)} barSize={10} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tickFormatter={v => `$${v / 1000}k`} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
              <Tooltip formatter={value => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Revenue" />
              <Bar dataKey="expenses" fill="#f87171" radius={[4, 4, 0, 0]} name="Expenses" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Avg. Revenue / Day', value: '$2,808', sub: 'Based on last 30 days' },
          { label: 'Total Users (YTD)', value: '14,230', sub: '+2,100 this month' },
          { label: 'Profit Margin', value: '62%', sub: '↑ 4% from last quarter' },
        ].map(stat => (
          <div key={stat.label} className="card text-center">
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stat.value}</p>
            <p className="text-xs text-gray-400 mt-1">{stat.sub}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
