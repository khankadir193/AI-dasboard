import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts'
import { Loader2 } from 'lucide-react'
import { memo } from 'react'

const EventDistributionChart = memo(({ kpiData = {}, loading = false, error = null }) => {
  // Transform kpiData to chart format
  const chartData = [
    { name: 'Dashboard Views', value: kpiData.dashboardViews || 0 },
    { name: 'User Logins', value: kpiData.activeUsers || 0 },
    { name: 'Projects Updated', value: kpiData.projectsUpdated || 0 },
    { name: 'Projects Created', value: kpiData.projectsCreated || 0 },
    { name: 'Projects Deleted', value: kpiData.projectsDeleted || 0 }
  ].filter(item => item.value > 0) // Only show events with data
    .sort((a, b) => b.value - a.value) // Sort descending

  const hasData = chartData.length > 0

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-semibold text-gray-900 dark:text-white">Event Distribution</h2>
          <p className="text-sm text-gray-500 mt-0.5">User actions by event type</p>
        </div>
        <span className="text-xs bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400 font-medium px-2.5 py-1 rounded-full">
          Real Data
        </span>
      </div>
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
        </div>
      ) : error ? (
        <div className="flex items-center justify-center h-64 text-red-600">
          <p>Error loading analytics data</p>
        </div>
      ) : !hasData ? (
        <div className="flex items-center justify-center h-64 text-gray-500">
          <p className="text-center">No analytics data available.<br />Create projects or use the dashboard to start tracking events.</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 120, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" className="dark:stroke-gray-800" horizontal={true} vertical={false} />
            <XAxis type="number" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
            <YAxis 
              type="category" 
              dataKey="name" 
              tick={{ fontSize: 12 }} 
              tickLine={false} 
              axisLine={false}
              width={110}
            />
            <Tooltip 
              formatter={(value) => [Number(value) || 0, 'Events']}
              contentStyle={{ 
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
              }}
            />
            <Bar 
              dataKey="value" 
              fill="#3b82f6" 
              radius={[0, 4, 4, 0]}
              barSize={24}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
})

export default EventDistributionChart
