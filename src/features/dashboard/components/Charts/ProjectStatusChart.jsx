import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip
} from 'recharts'
import { Loader2 } from 'lucide-react'

const ProjectStatusChart = ({ data, loading, error }) => {
  return (
    <div className="card">
      <h2 className="font-semibold text-gray-900 dark:text-white mb-1">Project Status</h2>
      <p className="text-sm text-gray-500 mb-4">Current distribution</p>
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="animate-spin h-6 w-6 text-blue-600" />
        </div>
      ) : error ? (
        <div className="flex items-center justify-center h-48 text-red-600">
          <p>Error loading project data</p>
        </div>
      ) : data.length === 0 ? (
        <div className="flex items-center justify-center h-48 text-gray-500">
          <p>No projects found</p>
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie 
                data={data} 
                cx="50%" 
                cy="50%" 
                innerRadius={55} 
                outerRadius={80} 
                paddingAngle={3} 
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip formatter={value => [value, 'Projects']} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {data.map((item, index) => (
              <div key={`legend-${index}`} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }} />
                  <span className="text-sm text-gray-600 dark:text-gray-400">{item.name}</span>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default ProjectStatusChart

