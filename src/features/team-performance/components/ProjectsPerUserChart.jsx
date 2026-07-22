import { memo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { FolderOpen, RotateCcw } from 'lucide-react'
import EmptyState from '../../../components/common/EmptyState'

function SkeletonChart() {
  return (
    <div className="card animate-pulse">
      <div className="mb-4">
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-44" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-56 mt-1.5" />
      </div>
      <div className="h-52 bg-gray-100 dark:bg-gray-800 rounded-lg" />
    </div>
  )
}

/**
 * ProjectsPerUserChart
 *
 * Horizontal bar chart showing projects created vs. updated per contributor.
 * Uses recharts (already a project dependency — no new library needed).
 *
 * Data shape (from completionEfficiency array in teamPerformanceService):
 *   [{ name, projectsCreated, projectsUpdated }]
 */
const ProjectsPerUserChart = memo(({ data = [], loading = false, error = null, onRetry }) => {
  if (loading) return <SkeletonChart />

  if (error) {
    return (
      <div className="card p-6 text-center">
        <p className="text-red-600 dark:text-red-400 mb-3 text-sm">
          Failed to load project data
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

  const hasData = data.some(
    (d) => (d.projectsCreated || 0) + (d.projectsUpdated || 0) > 0
  )

  if (!hasData) {
    return (
      <div className="card p-8 flex justify-center">
        <EmptyState
          icon={FolderOpen}
          title="No project activity yet"
          description="Project creation and update events will appear once the team starts working."
        />
      </div>
    )
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">Projects Per User</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Created vs. updated actions by contributor
          </p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 16, left: 100, bottom: 4 }}
          barGap={2}
          barCategoryGap="30%"
        >
          <CartesianGrid
            strokeDasharray="3 3"
            horizontal={false}
            stroke="#e5e7eb"
            className="dark:stroke-gray-700"
          />
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 11, fill: '#6b7280' }}
            tickLine={false}
            axisLine={false}
            width={94}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              fontSize: '12px',
            }}
            formatter={(value, name) => [value, name]}
          />
          <Legend
            wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }}
            iconType="square"
          />
          <Bar dataKey="projectsCreated" name="Created" fill="#3b82f6" radius={[0, 3, 3, 0]} barSize={10} />
          <Bar dataKey="projectsUpdated" name="Updated" fill="#10b981" radius={[0, 3, 3, 0]} barSize={10} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
})

ProjectsPerUserChart.displayName = 'ProjectsPerUserChart'
export default ProjectsPerUserChart
