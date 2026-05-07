import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts'
import { Loader2 } from 'lucide-react'
import { memo } from 'react'

const ActivityTimelineChart = memo(({ data = [], loading = false, error = null }) => {
  const safeData = Array.isArray(data) ? data : []

  return (
    <div className="card xl:col-span-2">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-semibold text-gray-900 dark:text-white">Activity Timeline</h2>
          <p className="text-sm text-gray-500 mt-0.5">Events tracked over time</p>
        </div>
        <span className="text-xs bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-medium px-2.5 py-1 rounded-full">
          Real Data
        </span>
      </div>
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
        </div>
      ) : error ? (
        <div className="flex items-center justify-center h-64 text-red-600">
          <p>Error loading activity data</p>
        </div>
      ) : safeData.length === 0 ? (
        <div className="flex items-center justify-center h-64 text-gray-500">
          <p className="text-center">No analytics activity yet.<br />Create projects or use the dashboard to start tracking events.</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={safeData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" className="dark:stroke-gray-800" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
            <Tooltip formatter={(value) => [Number(value) || 0, 'Events']} />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: '#3b82f6', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
})

export default ActivityTimelineChart
