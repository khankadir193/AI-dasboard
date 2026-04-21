import { TrendingUp, TrendingDown } from 'lucide-react'
import clsx from 'clsx'

export default function KPICard({ title, value, change, changeLabel, icon: Icon, color = 'blue' }) {
  const isPositive = change >= 0

  const colorMap = {
    blue:   'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400',
    green:  'bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400',
    purple: 'bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400',
    orange: 'bg-orange-50 dark:bg-orange-950 text-orange-600 dark:text-orange-400',
  }

  return (
    <div className="card fade-in hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
        </div>
        <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center', colorMap[color])}>
          <Icon size={20} />
        </div>
      </div>

      <div className="flex items-center gap-1.5 mt-4">
        <div className={clsx(
          'flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full',
          isPositive
            ? 'bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400'
            : 'bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400'
        )}>
          {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {Math.abs(change)}%
        </div>
        <span className="text-xs text-gray-500">{changeLabel}</span>
      </div>
    </div>
  )
}
