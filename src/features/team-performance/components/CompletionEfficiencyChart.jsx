import { memo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from 'recharts'
import { Target, RotateCcw } from 'lucide-react'
import EmptyState from '../../../components/common/EmptyState'

function SkeletonChart() {
  return (
    <div className="card animate-pulse">
      <div className="mb-4">
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-48" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-60 mt-1.5" />
      </div>
      <div className="h-52 bg-gray-100 dark:bg-gray-800 rounded-lg" />
    </div>
  )
}

/**
 * Custom tooltip showing total actions alongside the ratio.
 */
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload || {}
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-md p-3 text-xs">
      <p className="font-semibold text-gray-900 dark:text-white mb-1">{label}</p>
      <p className="text-gray-600 dark:text-gray-400">
        Actions: <span className="font-medium text-gray-900 dark:text-white">{d.totalActions}</span>
      </p>
      <p className="text-gray-600 dark:text-gray-400">
        Created: <span className="font-medium text-blue-600 dark:text-blue-400">{d.projectsCreated}</span>
      </p>
      <p className="text-gray-600 dark:text-gray-400">
        Updated: <span className="font-medium text-emerald-600 dark:text-emerald-400">{d.projectsUpdated}</span>
      </p>
    </div>
  )
}

/**
 * CompletionEfficiencyChart
 *
 * Bar chart of total actions per top contributor, color-graded by contribution level.
 * Provides a quick visual of who is most active and their project engagement breakdown.
 *
 * Data shape (from completionEfficiency in teamPerformanceService):
 *   [{ name, totalActions, projectsCreated, projectsUpdated, activeRatio }]
 */
const CompletionEfficiencyChart = memo(({ data = [], loading = false, error = null, onRetry }) => {
  if (loading) return <SkeletonChart />

  if (error) {
    return (
      <div className="card p-6 text-center">
        <p className="text-red-600 dark:text-red-400 mb-3 text-sm">
          Failed to load efficiency data
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

  const hasData = data.some((d) => d.totalActions > 0)

  if (!hasData) {
    return (
      <div className="card p-8 flex justify-center">
        <EmptyState
          icon={Target}
          title="No efficiency data yet"
          description="Contributor action metrics will appear once team activity is logged."
        />
      </div>
    )
  }

  // Color scale: gradient from blue-300 to blue-700 relative to max actions
  const maxActions = Math.max(...data.map((d) => d.totalActions), 1)
  const getColor = (totalActions) => {
    const ratio = totalActions / maxActions
    if (ratio >= 0.8) return '#1d4ed8' // blue-700
    if (ratio >= 0.6) return '#2563eb' // blue-600
    if (ratio >= 0.4) return '#3b82f6' // blue-500
    if (ratio >= 0.2) return '#60a5fa' // blue-400
    return '#93c5fd'                   // blue-300
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">Completion Efficiency</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Total actions per contributor (hover for breakdown)
          </p>
        </div>
        {data[0]?.activeRatio > 0 && (
          <span className="text-xs bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 font-medium px-2.5 py-1 rounded-full">
            {data[0].activeRatio}% projects active
          </span>
        )}
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <BarChart
          data={data}
          margin={{ top: 4, right: 8, left: 8, bottom: 24 }}
          barCategoryGap="35%"
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#e5e7eb"
            className="dark:stroke-gray-700"
          />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 10, fill: '#6b7280' }}
            tickLine={false}
            axisLine={false}
            interval={0}
            angle={-30}
            textAnchor="end"
            height={40}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="totalActions" radius={[4, 4, 0, 0]} barSize={32}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getColor(entry.totalActions)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
})

CompletionEfficiencyChart.displayName = 'CompletionEfficiencyChart'
export default CompletionEfficiencyChart
