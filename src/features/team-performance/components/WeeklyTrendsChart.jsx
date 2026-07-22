import { memo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine
} from 'recharts'
import { TrendingUp, RotateCcw } from 'lucide-react'
import EmptyState from '../../../components/common/EmptyState'

function SkeletonChart() {
  return (
    <div className="card animate-pulse">
      <div className="mb-4">
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-44" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-56 mt-1.5" />
      </div>
      <div className="h-48 bg-gray-100 dark:bg-gray-800 rounded-lg" />
    </div>
  )
}

/**
 * WeeklyTrendsChart
 *
 * Line chart showing total activity-log actions per ISO week for the last 12 weeks.
 * The week labels are derived from buildWeeklyTrends in teamPerformanceService —
 * formatted as "Jun 23", "Jun 30", etc. (Monday-start of each week).
 *
 * Data shape: [{ week, label, count }]
 */
const WeeklyTrendsChart = memo(({ data = [], loading = false, error = null, onRetry }) => {
  if (loading) return <SkeletonChart />

  if (error) {
    return (
      <div className="card p-6 text-center">
        <p className="text-red-600 dark:text-red-400 mb-3 text-sm">
          Failed to load weekly trends
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RotateCcw size={14} />
            Retry
          </button>
        )}
      </div>
    )
  }

  const hasData = data.some((d) => d.count > 0)

  if (!hasData) {
    return (
      <div className="card p-8 flex justify-center">
        <EmptyState
          icon={TrendingUp}
          title="No weekly activity yet"
          description="Weekly trends will appear once the team starts logging actions."
        />
      </div>
    )
  }

  // Average line for reference
  const avg = Math.round(
    data.reduce((sum, d) => sum + (d.count || 0), 0) / Math.max(data.length, 1)
  )

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">Weekly Activity Trends</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Total actions per week — last 12 weeks
          </p>
        </div>
        <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">
          avg {avg}/wk
        </span>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <LineChart
          data={data}
          margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#e5e7eb"
            className="dark:stroke-gray-700"
          />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
            width={32}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              fontSize: '12px',
            }}
            formatter={(value) => [value, 'Actions']}
            labelFormatter={(label) => `Week of ${label}`}
          />
          {avg > 0 && (
            <ReferenceLine
              y={avg}
              stroke="#9ca3af"
              strokeDasharray="4 4"
              label={{ value: 'avg', position: 'right', fontSize: 10, fill: '#9ca3af' }}
            />
          )}
          <Line
            type="monotone"
            dataKey="count"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ r: 3, fill: '#3b82f6', strokeWidth: 0 }}
            activeDot={{ r: 5, fill: '#2563eb' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
})

WeeklyTrendsChart.displayName = 'WeeklyTrendsChart'
export default WeeklyTrendsChart
