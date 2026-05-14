/**
 * SortIcon Component - Displays sort indicator
 */
import { ChevronUp, ChevronDown } from 'lucide-react'

export function SortIcon({ field, sortField, sortDir }) {
  if (sortField !== field)
    return <ChevronUp size={14} className="text-gray-300 dark:text-gray-600" />
  return sortDir === 'asc' ? (
    <ChevronUp size={14} className="text-blue-500" />
  ) : (
    <ChevronDown size={14} className="text-blue-500" />
  )
}

/**
 * SortableTableHeader Component
 */
export function SortableTableHeader({
  columns,
  sortField,
  sortDir,
  onSort
}) {
  return (
    <thead className="bg-gray-50 dark:bg-gray-900">
      <tr>
        {columns.map(col => (
          <th
            key={col.key}
            onClick={() => col.sortable && onSort(col.sortKey || col.key)}
            className={`px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap ${
              col.sortable
                ? 'cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-300'
                : ''
            }`}
          >
            <span className="flex items-center gap-1">
              {col.label}
              {col.sortable && (
                <SortIcon
                  field={col.sortKey || col.key}
                  sortField={sortField}
                  sortDir={sortDir}
                />
              )}
            </span>
          </th>
        ))}
      </tr>
    </thead>
  )
}
