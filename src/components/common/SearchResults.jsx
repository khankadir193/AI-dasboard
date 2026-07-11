import { useNavigate } from 'react-router-dom'
import { Loader2, FolderKanban, Users, History, Bell, Search } from 'lucide-react'

const SECTION_ICONS = {
  projects: { icon: FolderKanban, color: 'text-blue-600', label: 'Projects' },
  users: { icon: Users, color: 'text-green-600', label: 'Users' },
  activities: { icon: History, color: 'text-purple-600', label: 'Activity' },
  notifications: { icon: Bell, color: 'text-orange-600', label: 'Notifications' },
}

const NAV_PATHS = {
  projects: '/projects',
  users: '/data-table',
  activities: '/activity-logs',
  notifications: '/notifications',
}

export default function SearchResults({ data, isLoading, error, onSelect, onClose }) {
  const navigate = useNavigate()

  const hasAnyResults = data && Object.values(data).some((arr) => arr.length > 0)
  const totalCount = data
    ? Object.values(data).reduce((sum, arr) => sum + arr.length, 0)
    : 0

  const handleNavigate = (section, item) => {
    const path = NAV_PATHS[section] || '/'
    navigate(path)
    onSelect?.()
  }

  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 max-h-96 overflow-y-auto">
      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="animate-spin h-6 w-6 text-blue-600" />
        </div>
      )}

      {/* Error */}
      {!isLoading && error && (
        <div className="py-6 text-center">
          <p className="text-sm text-red-500">Search failed. Please try again.</p>
        </div>
      )}

      {/* Empty */}
      {!isLoading && !error && !hasAnyResults && (
        <div className="py-8 text-center">
          <Search size={24} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">No results found</p>
        </div>
      )}

      {/* Results */}
      {!isLoading && !error && hasAnyResults && (
        <div className="py-2">
          <p className="px-4 py-1.5 text-xs font-medium text-gray-400 uppercase tracking-wider">
            {totalCount} result{totalCount !== 1 ? 's' : ''}
          </p>
          {Object.entries(SECTION_ICONS).map(([section, config]) => {
            const items = data?.[section] || []
            if (items.length === 0) return null
            const { icon: Icon, color, label } = config

            return (
              <div key={section}>
                <div className="px-4 py-1.5 flex items-center gap-2">
                  <Icon size={14} className={color} />
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</span>
                </div>
                {items.map((item, idx) => (
                  <button
                    key={item.id || idx}
                    onClick={() => handleNavigate(section, item)}
                    className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {item.name || item.displayName || item.description || item.metric_type || item.action}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                      {item.status && `${item.status} · `}
                      {item.email || item.role || item.action || ''}
                    </p>
                  </button>
                ))}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
