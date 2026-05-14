/**
 * FilterBar Component - All filtering controls
 */
import { useState } from 'react'
import {
  Search,
  ChevronDownIcon,
  Calendar,
  X
} from 'lucide-react'

export function FilterBar({
  search,
  onSearchChange,
  statusFilter,
  onStatusChange,
  roleFilter,
  onRoleChange,
  dateRange,
  onDateRangeChange,
  hasActiveFilters,
  onClearFilters,
  onPageChange
}) {
  const [showDatePicker, setShowDatePicker] = useState(false)

  const handleDateApply = () => {
    setShowDatePicker(false)
    onPageChange(1)
  }

  const handleDateClear = () => {
    onDateRangeChange({ start: '', end: '' })
    onPageChange(1)
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 flex-1 min-w-[200px] max-w-[320px]">
        <Search size={16} className="text-gray-400 flex-shrink-0" />
        <input
          type="text"
          placeholder="Search by name, email or company..."
          value={search}
          onChange={e => {
            onSearchChange(e.target.value)
            onPageChange(1)
          }}
          className="bg-transparent text-sm text-gray-700 dark:text-gray-300 placeholder-gray-400 outline-none flex-1 w-full"
        />
      </div>

      {/* Status Filter */}
      <div className="relative">
        <select
          value={statusFilter}
          onChange={e => {
            onStatusChange(e.target.value)
            onPageChange(1)
          }}
          className="appearance-none bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 pr-8 text-sm text-gray-700 dark:text-gray-300 cursor-pointer hover:border-gray-300 dark:hover:border-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="All">Status: All</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
        <ChevronDownIcon size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      </div>

      {/* Role Filter */}
      <div className="relative">
        <select
          value={roleFilter}
          onChange={e => {
            onRoleChange(e.target.value)
            onPageChange(1)
          }}
          className="appearance-none bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 pr-8 text-sm text-gray-700 dark:text-gray-300 cursor-pointer hover:border-gray-300 dark:hover:border-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="All">Role: All</option>
          <option value="Admin">Admin</option>
          <option value="Manager">Manager</option>
          <option value="Analyst">Analyst</option>
          <option value="Viewer">Viewer</option>
        </select>
        <ChevronDownIcon size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      </div>

      {/* Date Range */}
      <div className="relative" data-date-picker>
        <button
          onClick={() => setShowDatePicker(!showDatePicker)}
          className={`inline-flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border rounded-lg text-sm transition-colors ${
            dateRange.start || dateRange.end
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          <Calendar
            size={16}
            className={
              dateRange.start || dateRange.end
                ? 'text-blue-500'
                : 'text-gray-400'
            }
          />
          {dateRange.start || dateRange.end ? 'Date Filtered' : 'Date Range'}
        </button>

        {showDatePicker && (
          <div
            className="absolute top-full left-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 z-50 min-w-[280px]"
            data-date-picker
          >
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  From
                </label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={e =>
                    onDateRangeChange(prev => ({
                      ...prev,
                      start: e.target.value
                    }))
                  }
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  To
                </label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={e =>
                    onDateRangeChange(prev => ({
                      ...prev,
                      end: e.target.value
                    }))
                  }
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleDateClear}
                  className="flex-1 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Clear
                </button>
                <button
                  onClick={handleDateApply}
                  className="flex-1 px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <button
          onClick={() => {
            onClearFilters()
            onPageChange(1)
          }}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
        >
          <X size={14} />
          Clear Filters
        </button>
      )}
    </div>
  )
}
