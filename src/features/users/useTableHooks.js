/**
 * Custom hooks for Users DataTable
 */

import { useState, useMemo, useRef, useEffect } from 'react'
import { isDateInRange, getSortValue, compareValues } from './tableUtils'

/**
 * Hook for managing table filtering logic
 */
export const useTableFiltering = (users, search, statusFilter, roleFilter, dateRange) => {
  return useMemo(() => {
    if (!users || !Array.isArray(users)) return []

    let data = [...users]

    // Search filter
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

    // Role filter
    if (roleFilter !== 'All') {
      data = data.filter(u => u?.role === roleFilter)
    }

    // Date range filter
    if (dateRange.start || dateRange.end) {
      data = data.filter(u =>
        isDateInRange(u?.created_at, dateRange.start, dateRange.end)
      )
    }

    return data
  }, [users, search, statusFilter, roleFilter, dateRange])
}

/**
 * Hook for managing table sorting logic
 */
export const useTableSorting = (data, sortField, sortDir) => {
  return useMemo(() => {
    const sorted = [...(data || [])]

    sorted.sort((a, b) => {
      const aVal = getSortValue(a, sortField)
      const bVal = getSortValue(b, sortField)
      return compareValues(aVal, bVal, sortDir)
    })

    return sorted
  }, [data, sortField, sortDir])
}

/**
 * Hook for managing table pagination
 */
export const useTablePagination = (data, pageSize) => {
  const [page, setPage] = useState(1)

  const totalPages = Math.ceil((data?.length || 0) / pageSize)
  const safePage = Math.min(Math.max(1, page), Math.max(1, totalPages))

  // Auto-correct page if it exceeds total pages
  useEffect(() => {
    if (safePage !== page && totalPages > 0) {
      setPage(safePage)
    }
  }, [safePage, page, totalPages])

  const paginated = data?.slice((safePage - 1) * pageSize, safePage * pageSize) || []

  return {
    page: safePage,
    setPage,
    totalPages,
    paginated,
    isFirstPage: safePage === 1,
    isLastPage: safePage === totalPages || totalPages === 0
  }
}

/**
 * Hook for closing dropdowns when clicking outside
 */
export const useClickOutside = (initialState = false) => {
  const [isOpen, setIsOpen] = useState(initialState)
  const ref = useRef(null)

  useEffect(() => {
    const handleClickOutside = event => {
      if (ref.current && !ref.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return { isOpen, setIsOpen, ref }
}

/**
 * Hook for managing action menu state per row
 */
export const useActionMenu = () => {
  const [actionMenuOpen, setActionMenuOpen] = useState(null)
  const actionMenuRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = event => {
      if (
        actionMenuRef.current &&
        !actionMenuRef.current.contains(event.target)
      ) {
        setActionMenuOpen(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return { actionMenuOpen, setActionMenuOpen, actionMenuRef }
}

/**
 * Hook for managing table filters state
 */
export const useTableFilters = () => {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [roleFilter, setRoleFilter] = useState('All')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })

  const hasActiveFilters =
    search ||
    statusFilter !== 'All' ||
    roleFilter !== 'All' ||
    dateRange.start ||
    dateRange.end

  const clearFilters = () => {
    setSearch('')
    setStatusFilter('All')
    setRoleFilter('All')
    setDateRange({ start: '', end: '' })
  }

  return {
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    roleFilter,
    setRoleFilter,
    dateRange,
    setDateRange,
    hasActiveFilters,
    clearFilters
  }
}

/**
 * Hook for managing table sorting state
 */
export const useTableSort = () => {
  const [sortField, setSortField] = useState('formattedId')
  const [sortDir, setSortDir] = useState('asc')

  const handleSort = field => {
    if (sortField === field) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  return { sortField, setSortField, sortDir, setSortDir, handleSort }
}
