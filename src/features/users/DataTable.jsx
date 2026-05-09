import { useState, useMemo, useRef, useEffect } from 'react'
import { Search, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Loader2, MoreVertical, Download, Plus, Calendar, Users2, ChevronDownIcon, X, Eye, Edit2, Ban, Trash2 } from 'lucide-react'
import { useDispatch } from 'react-redux'
import { useUsers } from '../../hooks/useFetch'
import { updateUserRole, toggleUserStatus } from '../../store/slices/usersSlice'

const PAGE_SIZE = 5

// Deterministic role colors (no random generation)
const ROLE_COLORS = {
  'admin': 'bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100',
  'editor': 'bg-amber-100 text-amber-800 dark:bg-amber-800 dark:text-amber-100',
  'viewer': 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100',
  'manager': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-800 dark:text-emerald-100',
  'analyst': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-800 dark:text-cyan-100'
}

// Deterministic status colors (no random generation)
const STATUS_COLORS = {
  'Active': 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100',
  'Inactive': 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
}

// Deterministic avatar gradients based on ID
const AVATAR_GRADIENTS = [
  'from-blue-400 to-blue-600',
  'from-indigo-400 to-indigo-600',
  'from-teal-400 to-teal-600',
  'from-amber-400 to-amber-600',
  'from-rose-400 to-rose-600',
  'from-violet-400 to-violet-600'
]

// Safe formatter for real Supabase data - no fake/mock data generation
const formatUsers = (rawUsers) => {
  if (!rawUsers || !Array.isArray(rawUsers)) return []

  return rawUsers.map((user, index) => {
    // Safe email extraction with fallback
    const email = user?.email || ''
    const emailPart = email?.split('@')?.[0] || 'user'

    // Derive display name from email or name fields
    const firstName = user?.first_name || ''
    const lastName = user?.last_name || ''
    const fullName = (firstName + ' ' + lastName).trim()
    const displayName = fullName || emailPart
      .replace(/[._-]/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase())

    // Safe initials generation
    const initials = displayName
      ?.split(' ')
      ?.map(n => n[0])
      ?.join('')
      ?.slice(0, 2)
      ?.toUpperCase() || 'U'

    // Normalize role (handle both 'admin' and 'Admin')
    const rawRole = user?.role || 'viewer'
    const normalizedRole = rawRole.charAt(0).toUpperCase() + rawRole.slice(1).toLowerCase()
    const roleKey = rawRole.toLowerCase()

    // Safe status determination - no random generation
    const isActive = user?.is_active !== false // default true
    const status = isActive ? 'Active' : 'Inactive'

    // Safe date formatting
    const joinedAt = user?.created_at
      ? new Date(user.created_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        })
      : 'N/A'

    // Deterministic gradient based on index
    const avatarGradient = AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length]

    // Safe company name extraction
    const companyName = user?.company?.name || 'No Company'

    return {
      ...user,
      formattedId: `#USR-${String(1001 + index).padStart(4, '0')}`,
      displayName,
      initials,
      role: normalizedRole,
      roleClass: ROLE_COLORS[roleKey] || ROLE_COLORS['viewer'],
      status,
      statusClass: STATUS_COLORS[status],
      joinedAt,
      avatarGradient,
      companyName,
      email,
      isActive
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
  const dispatch = useDispatch()
  const { data: rawUsers, isLoading } = useUsers()
  const users = useMemo(() => formatUsers(rawUsers), [rawUsers])

  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState('formattedId')
  const [sortDir, setSortDir] = useState('asc')
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('All')
  const [roleFilter, setRoleFilter] = useState('All')
  const [dateRange, setDateRange] = useState('')
  
  // Action menu state
  const [actionMenuOpen, setActionMenuOpen] = useState(null)
  const actionMenuRef = useRef(null)
  
  // Close action menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target)) {
        setActionMenuOpen(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  // Action handlers
  const handleViewUser = (user) => {
    console.log('View user:', user)
    alert(`View User: ${user.displayName}\nEmail: ${user.email}\nRole: ${user.role}\nStatus: ${user.status}`)
    setActionMenuOpen(null)
  }
  
  const handleEditRole = (user) => {
    const newRole = user.role === 'Admin' ? 'Viewer' : 'Admin'
    dispatch(updateUserRole({ userId: user.id, role: newRole.toLowerCase() }))
    setActionMenuOpen(null)
  }
  
  const handleToggleStatus = (user) => {
    dispatch(toggleUserStatus({ userId: user.id, is_active: !user.isActive }))
    setActionMenuOpen(null)
  }
  
  const handleDeleteUser = (user) => {
    if (confirm(`Are you sure you want to delete ${user.displayName}?`)) {
      console.log('Delete user:', user.id)
      setActionMenuOpen(null)
    }
  }

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
    if (!users || !Array.isArray(users)) return []
    let data = [...users]

    // Search with null safety
    if (search) {
      const q = search.toLowerCase()
      data = data.filter(u => {
        const displayName = (u?.displayName || '').toLowerCase()
        const email = (u?.email || '').toLowerCase()
        const companyName = (u?.companyName || '').toLowerCase()
        return displayName.includes(q) || email.includes(q) || companyName.includes(q)
      })
    }

    // Status filter
    if (statusFilter !== 'All') {
      data = data.filter(u => u?.status === statusFilter)
    }

    // Role filter (case insensitive)
    if (roleFilter !== 'All') {
      data = data.filter(u => u?.role === roleFilter)
    }

    // Sort with null safety
    data.sort((a, b) => {
      let aVal, bVal

      switch (sortField) {
        case 'formattedId':
          aVal = a?.id || 0
          bVal = b?.id || 0
          break
        case 'user':
          aVal = (a?.displayName || '').toLowerCase()
          bVal = (b?.displayName || '').toLowerCase()
          break
        case 'email':
          aVal = (a?.email || '').toLowerCase()
          bVal = (b?.email || '').toLowerCase()
          break
        case 'company':
          aVal = (a?.companyName || '').toLowerCase()
          bVal = (b?.companyName || '').toLowerCase()
          break
        case 'role':
          aVal = (a?.role || '').toLowerCase()
          bVal = (b?.role || '').toLowerCase()
          break
        case 'status':
          aVal = (a?.status || '').toLowerCase()
          bVal = (b?.status || '').toLowerCase()
          break
        case 'joinedAt':
          aVal = a?.created_at || ''
          bVal = b?.created_at || ''
          break
        default:
          aVal = a?.[sortField] || ''
          bVal = b?.[sortField] || ''
      }

      if (typeof aVal === 'string') aVal = aVal.toLowerCase()
      if (typeof bVal === 'string') bVal = bVal.toLowerCase()
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1
      return 0
    })

    return data
  }, [users, search, statusFilter, roleFilter, sortField, sortDir])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)

  // Pagination edge case: reset to page 1 if current page exceeds total pages
  const safePage = Math.min(page, Math.max(1, totalPages))
  if (safePage !== page && totalPages > 0) {
    setPage(safePage)
  }

  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const columns = [
    { key: 'formattedId', label: 'ID', sortable: true },
    { key: 'user', label: 'User', sortable: true, sortKey: 'user' },
    { key: 'email', label: 'Email', sortable: true, sortKey: 'email' },
    { key: 'company', label: 'Company', sortable: true, sortKey: 'company' },
    { key: 'role', label: 'Role', sortable: true, sortKey: 'role' },
    { key: 'status', label: 'Status', sortable: true, sortKey: 'status' },
    { key: 'joinedAt', label: 'Joined At', sortable: true, sortKey: 'joinedAt' },
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
        <div className="overflow-x-auto min-h-[400px]">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                {columns.map(col => (
                  <th
                    key={col.key}
                    onClick={() => col.sortable && handleSort(col.sortKey || col.key)}
                    className={`px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap ${
                      col.sortable ? 'cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-300' : ''
                    }`}
                  >
                    <span className="flex items-center gap-1">
                      {col.label}
                      {col.sortable && (
                        <SortIcon field={col.sortKey || col.key} sortField={sortField} sortDir={sortDir} />
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {isLoading ? (
                <tr className="h-[320px]">
                  <td colSpan={8} className="text-center py-16 text-gray-400">
                    <Loader2 size={24} className="animate-spin mx-auto mb-2" />
                    Loading data...
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr className="h-[320px]">
                  <td colSpan={8} className="h-full">
                    <div className="flex flex-col items-center justify-center h-full py-16 px-4">
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
                    key={user?.id || Math.random()}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    {/* ID */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-mono">{user?.formattedId || 'N/A'}</td>

                    {/* User with Avatar */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${user?.avatarGradient || 'from-gray-400 to-gray-600'} flex items-center justify-center text-white text-sm font-semibold flex-shrink-0`}>
                          {user?.initials || 'U'}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.displayName || 'Unknown'}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email?.split('@')[0] || ''}</p>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{user?.email || 'N/A'}</td>

                    {/* Company */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                        {user?.companyName || 'No Company'}
                      </span>
                    </td>

                    {/* Role */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${user?.roleClass || ROLE_COLORS['viewer']}`}>
                        {user?.role || 'Viewer'}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${user?.statusClass || STATUS_COLORS['Active']}`}>
                        {user?.status || 'Active'}
                      </span>
                    </td>

                    {/* Joined At */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{user?.joinedAt || 'N/A'}</td>

                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap text-right relative" ref={actionMenuOpen === user?.id ? actionMenuRef : null}>
                      <button 
                        onClick={() => setActionMenuOpen(actionMenuOpen === user?.id ? null : user?.id)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <MoreVertical size={18} />
                      </button>
                      
                      {/* Action Menu Dropdown */}
                      {actionMenuOpen === user?.id && (
                        <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                          <button
                            onClick={() => handleViewUser(user)}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                          >
                            <Eye size={14} />
                            View User
                          </button>
                          <button
                            onClick={() => handleEditRole(user)}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                          >
                            <Edit2 size={14} />
                            Edit Role
                          </button>
                          <button
                            onClick={() => handleToggleStatus(user)}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                          >
                            <Ban size={14} />
                            {user.isActive ? 'Suspend User' : 'Activate User'}
                          </button>
                          <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                          <button
                            onClick={() => handleDeleteUser(user)}
                            className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                          >
                            <Trash2 size={14} />
                            Delete User
                          </button>
                        </div>
                      )}
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
              Showing {(safePage - 1) * PAGE_SIZE + 1} to {Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length} users
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={safePage === 1}
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

                  if (safePage > 3) {
                    pages.push('...')
                  }

                  // Show pages around current
                  const start = Math.max(2, safePage - 1)
                  const end = Math.min(totalPages - 1, safePage + 1)

                  for (let i = start; i <= end; i++) {
                    if (!pages.includes(i)) {
                      pages.push(i)
                    }
                  }

                  if (safePage < totalPages - 2) {
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
                        p === safePage
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
                disabled={safePage === totalPages || totalPages === 0}
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
