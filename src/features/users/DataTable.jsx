import { useState, useMemo } from 'react'
import { Search, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Loader2, MoreVertical, Download, Plus, Calendar, Users2, ChevronDownIcon, X } from 'lucide-react'
import { useUsers } from '../../hooks/useFetch'

const PAGE_SIZE = 5

// Generate consistent mock data for the enhanced fields
const generateMockData = (users) => {
  if (!users) return []
  const roles = ['Admin', 'Editor', 'Viewer']
  const roleColors = {
    'Admin': 'bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100',
    'Editor': 'bg-amber-100 text-amber-800 dark:bg-amber-800 dark:text-amber-100',
    'Viewer': 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100'
  }
  const statusOptions = ['Active', 'Inactive']
  const statusColors = {
    'Active': 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100',
    'Inactive': 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
  }
  const avatarColors = [
    'from-blue-400 to-blue-600',
    'from-indigo-400 to-indigo-600',
    'from-teal-400 to-teal-600',
    'from-amber-400 to-amber-600',
    'from-rose-400 to-rose-600',
    'from-violet-400 to-violet-600'
  ]

  return users.map((user, index) => {
    const roleIndex = (user.id * 7) % 3
    const statusIndex = (user.id * 13) % 2
    const daysAgo = (index % 30) + 1
    const date = new Date()
    date.setDate(date.getDate() - daysAgo)

    return {
      ...user,
      formattedId: `#USR-${1000 + user.id}`,
      role: roles[roleIndex],
      roleClass: roleColors[roles[roleIndex]],
      status: statusOptions[statusIndex],
      statusClass: statusColors[statusOptions[statusIndex]],
      joinedAt: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      avatarGradient: avatarColors[index % avatarColors.length],
      initials: user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    }
  })
}

function SortIcon({ field, sortField, sortDir }) {
  if (sortField !== field) return <ChevronUp size={14} className="text-gray-300 dark:text-gray-600" />
  return sortDir === 'asc'
    ? <ChevronUp size={14} className="text-blue-500" />
    : <ChevronDown size={14} className="text-blue-500" />
}

export default function DataTable() {
  const { data: rawUsers, isLoading } = useUsers()
  const users = useMemo(() => generateMockData(rawUsers), [rawUsers])

  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState('formattedId')
  const [sortDir, setSortDir] = useState('asc')
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('All')
  const [roleFilter, setRoleFilter] = useState('All')
  const [dateRange, setDateRange] = useState('')

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('asc')
    }
    setPage(1)
  }

  const hasActiveFilters = search || statusFilter !== 'All' || roleFilter !== 'All' || dateRange

  const clearAllFilters = () => {
    setSearch('')
    setStatusFilter('All')
    setRoleFilter('All')
    setDateRange('')
    setPage(1)
  }

  const filtered = useMemo(() => {
    if (!users) return []
    let data = [...users]

    // Search
    if (search) {
      const q = search.toLowerCase()
      data = data.filter(u =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.company.name.toLowerCase().includes(q)
      )
    }

    // Status filter
    if (statusFilter !== 'All') {
      data = data.filter(u => u.status === statusFilter)
    }

    // Role filter
    if (roleFilter !== 'All') {
      data = data.filter(u => u.role === roleFilter)
    }

    // Sort
    data.sort((a, b) => {
      let aVal = a[sortField]
      let bVal = b[sortField]
      if (sortField === 'formattedId') { aVal = a.id; bVal = b.id }
      if (sortField === 'user') { aVal = a.name.toLowerCase(); bVal = b.name.toLowerCase() }
      if (sortField === 'company') { aVal = a.company.name.toLowerCase(); bVal = b.company.name.toLowerCase() }
      if (typeof aVal === 'string') aVal = aVal.toLowerCase()
      if (typeof bVal === 'string') bVal = bVal.toLowerCase()
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1
      return 0
    })

    return data
  }, [users, search, statusFilter, roleFilter, sortField, sortDir])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const columns = [
    { key: 'formattedId', label: 'ID', sortable: true },
    { key: 'user', label: 'User', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'company', label: 'Company', sortable: true },
    { key: 'role', label: 'Role', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'joinedAt', label: 'Joined At', sortable: true },
    { key: 'actions', label: 'Actions', sortable: false }
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Users</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage and view all registered users in your workspace.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <Download size={16} />
            Export
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
            <Plus size={16} />
            Add User
          </button>
        </div>
      </div>

      {/* Toolbar / Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 flex-1 min-w-[200px] max-w-[320px]">
          <Search size={16} className="text-gray-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search by name, email or company..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="bg-transparent text-sm text-gray-700 dark:text-gray-300 placeholder-gray-400 outline-none flex-1 w-full"
          />
        </div>

        {/* Status Filter */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
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
            onChange={e => { setRoleFilter(e.target.value); setPage(1) }}
            className="appearance-none bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 pr-8 text-sm text-gray-700 dark:text-gray-300 cursor-pointer hover:border-gray-300 dark:hover:border-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="All">Role: All</option>
            <option value="Admin">Admin</option>
            <option value="Editor">Editor</option>
            <option value="Viewer">Viewer</option>
          </select>
          <ChevronDownIcon size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>

        {/* Date Range */}
        <button className="inline-flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
          <Calendar size={16} className="text-gray-400" />
          Date Range
        </button>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
          >
            <X size={14} />
            Clear Filters
          </button>
        )}
      </div>

      {/* Table Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                {columns.map(col => (
                  <th
                    key={col.key}
                    onClick={() => col.sortable && handleSort(col.key === 'user' ? 'name' : col.key === 'formattedId' ? 'id' : col.key)}
                    className={`px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap ${
                      col.sortable ? 'cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-300' : ''
                    }`}
                  >
                    <span className="flex items-center gap-1">
                      {col.label}
                      {col.sortable && (
                        <SortIcon field={col.key === 'user' ? 'name' : col.key === 'formattedId' ? 'id' : col.key} sortField={sortField} sortDir={sortDir} />
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="text-center py-16 text-gray-400">
                    <Loader2 size={24} className="animate-spin mx-auto mb-2" />
                    Loading data...
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div className="flex flex-col items-center justify-center py-16 px-4">
                      <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                        <Users2 size={24} className="text-gray-400" />
                      </div>
                      <p className="text-gray-900 dark:text-white font-medium mb-1">No users found</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Try adjusting your search or filters.</p>
                      <button
                        onClick={clearAllFilters}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        Clear Filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginated.map(user => (
                  <tr
                    key={user.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    {/* ID */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-mono">{user.formattedId}</td>

                    {/* User with Avatar */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${user.avatarGradient} flex items-center justify-center text-white text-xs font-semibold flex-shrink-0`}>
                          {user.initials}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{user.username}</p>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{user.email}</td>

                    {/* Company */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
                        {user.company.name}
                      </span>
                    </td>

                    {/* Role */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${user.roleClass}`}>
                        {user.role}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${user.statusClass}`}>
                        {user.status}
                      </span>
                    </td>

                    {/* Joined At */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{user.joinedAt}</td>

                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                        <MoreVertical size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {!isLoading && filtered.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Showing {(page - 1) * PAGE_SIZE + 1} to {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} users
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={18} />
              </button>

              {/* Show page numbers with ellipsis */}
              {(() => {
                const pages = []
                const maxVisible = 5

                if (totalPages <= maxVisible + 2) {
                  for (let i = 1; i <= totalPages; i++) {
                    pages.push(i)
                  }
                } else {
                  // Always show first page
                  pages.push(1)

                  if (page > 3) {
                    pages.push('...')
                  }

                  // Show pages around current
                  const start = Math.max(2, page - 1)
                  const end = Math.min(totalPages - 1, page + 1)

                  for (let i = start; i <= end; i++) {
                    if (!pages.includes(i)) {
                      pages.push(i)
                    }
                  }

                  if (page < totalPages - 2) {
                    if (!pages.includes('...')) pages.push('...')
                  }

                  // Always show last page
                  if (!pages.includes(totalPages)) {
                    pages.push(totalPages)
                  }
                }

                return pages.map((p, idx) =>
                  p === '...' ? (
                    <span key={`ellipsis-${idx}`} className="px-2 text-gray-400">...</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                        p === page
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      {p}
                    </button>
                  )
                )
              })()}

              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
