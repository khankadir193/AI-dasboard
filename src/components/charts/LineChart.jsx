import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const CustomLineChart = ({ 
  data, 
  xDataKey, 
  yDataKey, 
  title, 
  color = '#3B82F6',
  height = 300,
  showLegend = false,
  strokeWidth = 2,
  ...props 
}) => {
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {yDataKey}: {payload[0].value}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="w-full">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {title}
        </h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} {...props}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" className="dark:stroke-gray-700" />
          <XAxis 
            dataKey={xDataKey} 
            stroke="#6B7280"
            tick={{ fill: '#6B7280' }}
            className="dark:fill-gray-400"
          />
          <YAxis 
            stroke="#6B7280"
            tick={{ fill: '#6B7280' }}
            className="dark:fill-gray-400"
          />
          <Tooltip content={<CustomTooltip />} />
          {showLegend && <Legend />}
          <Line 
            type="monotone" 
            dataKey={yDataKey} 
            stroke={color}
            strokeWidth={strokeWidth}
            dot={{ fill: color, r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default CustomLineChart
