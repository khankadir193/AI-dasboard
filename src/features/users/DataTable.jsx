import { Plus } from 'lucide-react'
import { useMemo, useRef, useState, useEffect } from 'react'
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
import { formatUsers } from './tableUtils'

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
import { TableLoadingState, TableErrorState, TableEmptyState } from './components/TableStates'

import Modal from '../../components/common/Modal'
import Input from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'

const PENDING_STATUS = 'Pending'

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

  // Invite Member (UI-only placeholder workflow)
  const [isInviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('Member')
  const [inviteMessage, setInviteMessage] = useState("You've been invited to join the InsightAI workspace.")
  const [isSending, setIsSending] = useState(false)

  const [pendingInvites, setPendingInvites] = useState([])

  const [toast, setToast] = useState(null) // { id, message }
  const toastTimerRef = useRef(null)

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    }
  }, [])

  const showToast = (message) => {
    const id = `${Date.now()}-${Math.random()}`
    setToast({ id, message })
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    toastTimerRef.current = setTimeout(() => setToast(null), 3200)
  }

  const closeInvite = () => {
    if (isSending) return
    setInviteOpen(false)
  }

  const validateEmail = (value) => {
    if (!value) return false
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  }

  const displayUsers = useMemo(() => {
    // UI-only: merge backend users with locally created pending invite rows.
    // Do not change backend or API flow.
    return [...pendingInvites, ...(users || [])]
  }, [pendingInvites, users])

  // Apply filters and sorting
  const filteredUsers = useTableFiltering(
    displayUsers,
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

  const inviteEmailError = inviteEmail
    ? (validateEmail(inviteEmail) ? '' : 'Enter a valid email address')
    : ''

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
  const handleViewUser = (user) => {
    alert(
      `View User: ${user.displayName}\nEmail: ${user.email}\nRole: ${user.role}\nStatus: ${user.status}`
    )
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
      setActionMenuOpen(null)
    }
  }

  const handleSendInvite = async (e) => {
    e?.preventDefault?.()
    if (isSending) return

    if (!inviteEmail || !validateEmail(inviteEmail)) {
      showToast('Please enter a valid email address')
      return
    }

    setIsSending(true)

    // UI-only placeholder: simulate request latency without backend changes.
    await new Promise(resolve => setTimeout(resolve, 600))

    const tempId = `pending_${Date.now()}_${Math.random().toString(16).slice(2)}`
    const initials = (inviteEmail.split('@')[0] || 'U')
      .replace(/[._-]/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase())
      .split(' ')
      .filter(Boolean)
      .map(w => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'U'

    const pendingRow = {
      id: tempId,
      formattedId: `#INV-${Math.floor(Math.random() * 9000 + 1000)}`,
      displayName: inviteEmail.split('@')[0] ? inviteEmail.split('@')[0].replace(/[._-]/g, ' ') : 'Pending Member',
      initials,
      email: inviteEmail,
      companyName: 'Pending invite',
      role: inviteRole,
      roleClass:
        inviteRole === 'Admin'
          ? 'bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100'
          : inviteRole === 'Manager'
            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-800 dark:text-emerald-100'
            : inviteRole === 'Viewer'
              ? 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100'
              : 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200',
      status: PENDING_STATUS,
      statusClass: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200',
      joinedAt: 'N/A',
      avatarGradient: 'from-amber-400 to-amber-600',
      isActive: false
    }

    setPendingInvites(prev => [pendingRow, ...prev])

    setIsSending(false)
    setInviteEmail('')
    setInviteRole('Member')
    setInviteMessage("You've been invited to join the InsightAI workspace.")
    setInviteOpen(false)

    showToast('Invitation sent successfully')
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Team Management</h1>
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
            onClick={() => setInviteOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/30"
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
        <div className="overflow-x-auto min-h-[420px] [scrollbar-width:thin]">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
            <SortableTableHeader
              columns={TABLE_COLUMNS}
              sortField={sortState.sortField}
              sortDir={sortState.sortDir}
              onSort={(field) => {
                sortState.handleSort(field)
                pagination.setPage(1)
              }}
            />

            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {isLoading ? (
                <TableLoadingState />
              ) : error ? (
                <TableErrorState error={error} />
              ) : pagination.paginated.length === 0 ? (
                <TableEmptyState
                  onClearFilters={filterState.clearFilters}
                  onInvite={((users?.length || 0) === 0 && pendingInvites.length === 0)
                    ? () => setInviteOpen(true)
                    : undefined}
                />
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
                    onResendInviteUI={(u) => {
                      setActionMenuOpen(null)
                      showToast('Resend invite requested')
                    }}
                    onCancelPendingInviteUI={(u) => {
                      setActionMenuOpen(null)
                      setPendingInvites(prev => prev.filter(p => p.id !== u?.id))
                      showToast('Invitation canceled')
                    }}
                    onCopyInviteLinkUI={(u) => {
                      setActionMenuOpen(null)
                      showToast('Copy link is not configured')
                    }}
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

        {/* Invite Member Modal */}
        <Modal
          isOpen={isInviteOpen}
          onClose={closeInvite}
          title="Invite Member"
          size="md"
          closeOnBackdrop
          showCloseButton
        >
          <div className="max-h-[calc(100vh-10rem)] overflow-y-auto pr-0.5">
            <form onSubmit={handleSendInvite} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-900 dark:text-white">
                  Email Address
                </label>
                <Input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="john@company.com"
                  disabled={isSending}
                  error={inviteEmailError || undefined}
                  aria-invalid={!!inviteEmailError}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {inviteEmailError
                    ? inviteEmailError
                    : 'Send an invitation email to add a new member.'}
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-900 dark:text-white">
                  Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  disabled={isSending}
                  className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                >
                  <option value="Admin">Admin</option>
                  <option value="Manager">Manager</option>
                  <option value="Member">Member</option>
                  <option value="Viewer">Viewer</option>
                </select>

                <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-900/30 p-3">
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-200 mb-2">
                    Role access (what they can do)
                  </p>
                  <div className="space-y-1.5">
                    <div className="flex items-start gap-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200">
                        Admin
                      </span>
                      <span className="text-xs text-gray-600 dark:text-gray-300">Full workspace access</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
                        Manager
                      </span>
                      <span className="text-xs text-gray-600 dark:text-gray-300">Manage projects and members</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200">
                        Member
                      </span>
                      <span className="text-xs text-gray-600 dark:text-gray-300">Standard workspace access</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-800 dark:bg-slate-900/40 dark:text-slate-200">
                        Viewer
                      </span>
                      <span className="text-xs text-gray-600 dark:text-gray-300">Read-only access</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-900 dark:text-white">
                  Optional Message
                </label>

                <textarea
                  value={inviteMessage}
                  onChange={(e) => setInviteMessage(e.target.value)}
                  disabled={isSending}
                  placeholder="You've been invited to join the InsightAI workspace."
                  rows={2}
                  className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={isSending}
                  onClick={closeInvite}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  loading={isSending}
                  disabled={isSending || !inviteEmail || !!inviteEmailError}
                  className="w-full sm:w-auto"
                >
                  Send Invite
                </Button>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Badge variant="warning" size="sm">Pending</Badge>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  This UI adds a pending member row locally only.
                </span>
              </div>
            </form>
          </div>
        </Modal>

        {/* Minimal toast/snackbar */}
        {toast && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60]" aria-live="polite" role="status">
            <div className="bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg text-sm max-w-[90vw]">
              {toast.message}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

