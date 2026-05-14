import { Plus } from 'lucide-react'
import { useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useUsers } from '../../hooks/useFetch'
import { updateUserRole, toggleUserStatus } from '../../store/slices/usersSlice'

// Import custom hooks
import {
  useTableFilters,
  useTableSort,
  useTablePagination,
  useTableFiltering,
  useTableSorting,
  useActionMenu
} from './useTableHooks'

// Import utilities
import { formatUsers, buildExportData } from './tableUtils'

// Import constants
import { PAGE_SIZE, TABLE_COLUMNS } from './tableConstants'

// Import export service
import { exportUsers } from './tableExportService'

// Import components
import { SortableTableHeader } from './components/SortableTableHeader'
import { UserTableRow } from './components/UserTableRow'
import { TablePagination } from './components/TablePagination'
import { FilterBar } from './components/FilterBar'
import { ExportMenu } from './components/ExportMenu'
import {
  TableLoadingState,
  TableErrorState,
  TableEmptyState
} from './components/TableStates'

export default function DataTable() {
  const dispatch = useDispatch()
  const { data: rawUsers, isLoading, error } = useUsers()
  const users = useMemo(() => formatUsers(rawUsers), [rawUsers])
  const profile = useSelector(state => state.profile.profile)
  const isAdmin = profile?.role === 'admin'

  // Use custom hooks for state management
  const filterState = useTableFilters()
  const sortState = useTableSort()
  const { actionMenuOpen, setActionMenuOpen, actionMenuRef } = useActionMenu()

  // Apply filters and sorting
  const filteredUsers = useTableFiltering(
    users,
    filterState.search,
    filterState.statusFilter,
    filterState.roleFilter,
    filterState.dateRange
  )

  const sortedUsers = useTableSorting(
    filteredUsers,
    sortState.sortField,
    sortState.sortDir
  )

  // Pagination
  const pagination = useTablePagination(sortedUsers, PAGE_SIZE)

  // Export handlers
  const handleExportCSV = () => {
    exportUsers('csv', sortedUsers)
  }

  const handleExportExcel = () => {
    exportUsers('xlsx', sortedUsers)
  }

  const handleExportPDF = () => {
    exportUsers('pdf', sortedUsers)
  }

  // Action handlers
  const handleViewUser = user => {
    alert(
      `View User: ${user.displayName}\nEmail: ${user.email}\nRole: ${user.role}\nStatus: ${user.status}`
    )
    setActionMenuOpen(null)
  }

  const handleEditRole = user => {
    const newRole = user.role === 'Admin' ? 'Viewer' : 'Admin'
    dispatch(updateUserRole({ userId: user.id, role: newRole.toLowerCase() }))
    setActionMenuOpen(null)
  }

  const handleToggleStatus = user => {
    dispatch(toggleUserStatus({ userId: user.id, is_active: !user.isActive }))
    setActionMenuOpen(null)
  }

  const handleDeleteUser = user => {
    if (confirm(`Are you sure you want to delete ${user.displayName}?`)) {
      setActionMenuOpen(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Team Management
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage team members, roles, and workspace access.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ExportMenu
            isAdmin={isAdmin}
            hasData={sortedUsers.length > 0}
            onExportCSV={handleExportCSV}
            onExportExcel={handleExportExcel}
            onExportPDF={handleExportPDF}
          />
          <button
            onClick={() => alert('Invite Member coming soon (UI only)')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={16} />
            Invite Member
          </button>
        </div>
      </div>


      {/* Filter Bar */}
      <FilterBar
        search={filterState.search}
        onSearchChange={filterState.setSearch}
        statusFilter={filterState.statusFilter}
        onStatusChange={filterState.setStatusFilter}
        roleFilter={filterState.roleFilter}
        onRoleChange={filterState.setRoleFilter}
        dateRange={filterState.dateRange}
        onDateRangeChange={filterState.setDateRange}
        hasActiveFilters={filterState.hasActiveFilters}
        onClearFilters={() => {
          filterState.clearFilters()
          pagination.setPage(1)
        }}
        onPageChange={pagination.setPage}
      />

      {/* Table Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
            {/* Table Header */}
            <SortableTableHeader
              columns={TABLE_COLUMNS}
              sortField={sortState.sortField}
              sortDir={sortState.sortDir}
              onSort={(field) => {
                sortState.handleSort(field)
                pagination.setPage(1)
              }}
            />

            {/* Table Body */}
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {isLoading ? (
                <TableLoadingState />
              ) : error ? (
                <TableErrorState error={error} />
              ) : pagination.paginated.length === 0 ? (
                <TableEmptyState onClearFilters={filterState.clearFilters} />
              ) : (
                pagination.paginated.map(user => (
                  <UserTableRow
                    key={user?.id ?? user?.formattedId}
                    user={user}
                    isActionMenuOpen={actionMenuOpen}
                    onActionMenuToggle={setActionMenuOpen}
                    onActionMenuRef={actionMenuRef}
                    onView={handleViewUser}
                    onEditRole={handleEditRole}
                    onToggleStatus={handleToggleStatus}
                    onDelete={handleDeleteUser}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {!isLoading && sortedUsers.length > 0 && (
          <TablePagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            totalItems={sortedUsers.length}
            pageSize={PAGE_SIZE}
            onPageChange={pagination.setPage}
            isDisabled={false}
          />
        )}
      </div>
    </div>
  )
}
