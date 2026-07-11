import { Plus } from 'lucide-react'
import { useMemo, useRef, useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useUsers } from '../../hooks/useFetch'
import {
  fetchAllUsers,
  updateUserRole,
  updateMemberStatus,
  removeMember
} from '../../store/slices/usersSlice'
import { getEditableRolesForActor, canEditTargetMember } from '../../utils/teamPermissions'
import {
  createInvite,
  getPendingInvitesForCompany,
  cancelInvite,
  resendInvite,
  sendInviteEmail,
  buildInviteUrl,
  getInviteToken
} from '../../services/invitesService'
import { logActivity, ACTIONS, RESOURCE_TYPES } from '../../services/activityLogService'

import { supabase } from '../../lib/supabaseClient'



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
import Button from '../../components/ui/Button'
import FeatureGate from '../../components/auth/FeatureGate'

const PENDING_STATUS = 'Pending'

function DataTableContent() {
  const dispatch = useDispatch()
  const { data: rawUsers, isLoading, error } = useUsers()
  const users = useMemo(() => formatUsers(rawUsers), [rawUsers])
  const profile = useSelector(state => state.profile.profile)
  const currentUserId = useSelector(state => state.auth.user?.id)
  const currentRole = profile?.role
  const currentRoleKey = String(currentRole || '').toLowerCase().trim()
  const canInvite = currentRoleKey === 'admin'
  const isAdmin = currentRoleKey === 'admin'
  const companyId = profile?.company_id


  const [viewUser, setViewUser] = useState(null)
  const [editUser, setEditUser] = useState(null)
  const [editRoleValue, setEditRoleValue] = useState('viewer')
  const [confirmSuspendUser, setConfirmSuspendUser] = useState(null)
  const [confirmRemoveUser, setConfirmRemoveUser] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)




  // Use custom hooks for state management
  const filterState = useTableFilters()
  const sortState = useTableSort()
  const { actionMenuOpen, setActionMenuOpen } = useActionMenu()

  // Invite Member (UI-only placeholder workflow)
  const [isInviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('Analyst')
  const [inviteMessage, setInviteMessage] = useState("You've been invited to join the InsightAI workspace.")
  const [isSending, setIsSending] = useState(false)

  const [pendingInvites, setPendingInvites] = useState([])
  const [isInvitesLoading, setIsInvitesLoading] = useState(false)

  useEffect(() => {
    refreshPendingInvites()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId])

  const refreshPendingInvites = async () => {
    if (!companyId) return

    setIsInvitesLoading(true)
    try {
      const rows = await getPendingInvitesForCompany(companyId)
      setPendingInvites(rows)
    } catch (err) {
      // Keep UI resilient: don't block active users
      console.error('Failed to fetch pending invites', err)
    } finally {
      setIsInvitesLoading(false)
    }
  }


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

  const refreshUsers = () => dispatch(fetchAllUsers())

  const handleViewUser = (user) => {
    setViewUser(user)
    setActionMenuOpen(null)
  }

  const handleEditRoleOpen = (user) => {
    if (!canEditTargetMember(currentRoleKey, user?.roleKey || user?.role)) {
      showToast('You do not have permission to edit this member')
      setActionMenuOpen(null)
      return
    }
    setEditUser(user)
    setEditRoleValue(String(user?.roleKey || user?.role || 'viewer').toLowerCase())
    setActionMenuOpen(null)
  }

  const handleSaveRole = async (e) => {
    e?.preventDefault?.()
    if (!editUser?.id || actionLoading) return

    const payload = { userId: editUser.id, role: editRoleValue, companyId }
    console.log('[EditRole] payload:', payload)

    setActionLoading(true)
    try {
      await dispatch(updateUserRole(payload)).unwrap()
      await refreshUsers()
      showToast('Role updated successfully')
      setEditUser(null)
    } catch (err) {
      showToast(typeof err === 'string' ? err : err?.message || 'Failed to update role')
    } finally {
      setActionLoading(false)
    }
  }

  const handleToggleStatusOpen = (user) => {
    if (user?.id === currentUserId) {
      showToast('You cannot suspend your own account')
      setActionMenuOpen(null)
      return
    }
    if (!canEditTargetMember(currentRoleKey, user?.roleKey || user?.role)) {
      showToast('You do not have permission to suspend this member')
      setActionMenuOpen(null)
      return
    }
    setConfirmSuspendUser(user)
    setActionMenuOpen(null)
  }

  const handleConfirmSuspend = async () => {
    if (!confirmSuspendUser?.id || actionLoading) return

    console.log('[SuspendUser] member:', confirmSuspendUser)

    const isInactive =
      confirmSuspendUser?.status === 'Inactive' ||
      confirmSuspendUser?.membership_status === 'inactive'
    const nextStatus = isInactive ? 'active' : 'inactive'

    setActionLoading(true)
    try {
      await dispatch(
        updateMemberStatus({
          userId: confirmSuspendUser.id,
          status: nextStatus,
          companyId
        })
      ).unwrap()
      await refreshUsers()
      showToast(isInactive ? 'User activated successfully' : 'User suspended successfully')
      setConfirmSuspendUser(null)
    } catch (err) {
      showToast(typeof err === 'string' ? err : err?.message || 'Failed to update user status')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteUserOpen = (user) => {
    if (user?.id === currentUserId) {
      showToast('You cannot remove your own account')
      setActionMenuOpen(null)
      return
    }
    if (!canEditTargetMember(currentRoleKey, user?.roleKey || user?.role)) {
      showToast('You do not have permission to remove this member')
      setActionMenuOpen(null)
      return
    }
    setConfirmRemoveUser(user)
    setActionMenuOpen(null)
  }

  const handleConfirmRemove = async () => {
    if (!confirmRemoveUser?.id || actionLoading) return

    console.log('[RemoveUser] member:', confirmRemoveUser)

    setActionLoading(true)
    try {
      await dispatch(
        removeMember({ userId: confirmRemoveUser.id, companyId })
      ).unwrap()
      await refreshUsers()
      showToast('User removed from workspace')
      setConfirmRemoveUser(null)
    } catch (err) {
      showToast(typeof err === 'string' ? err : err?.message || 'Failed to remove user')
    } finally {
      setActionLoading(false)
    }
  }

  const editableRolesForModal = editUser
    ? getEditableRolesForActor(currentRoleKey, editUser.roleKey || editUser.role)
    : []

  const handleSendInvite = async (e) => {
    e?.preventDefault?.()
    if (isSending) return

    if (!canInvite) {
      showToast('You do not have permission to invite members')
      return
    }

    if (!companyId) {
      showToast('Company context not ready')
      return
    }

    if (!inviteEmail || !validateEmail(inviteEmail)) {
      showToast('Please enter a valid email address')
      return
    }

    setIsSending(true)
    try {
      const dbRole = String(inviteRole || '').toLowerCase().trim()

      if (currentRoleKey !== 'admin') {
        showToast('You do not have permission to invite members')
        return
      }

      const pendingRow = await createInvite({
        email: inviteEmail.trim(),
        role: dbRole,
        companyId
      })

      // Send email via Edge Function (production-safe: server validates invite)
      if (!pendingRow?.id) {
        throw new Error('Invite id missing after creation')
      }

      logActivity({
        companyId,
        userId: profile?.id,
        action: ACTIONS.INVITE_SEND,
        resourceType: RESOURCE_TYPES.INVITE,
        resourceId: pendingRow.id,
        description: `Invitation sent to ${inviteEmail.trim()}`,
        metadata: { email: inviteEmail.trim(), role: dbRole }
      })

      try {
        await sendInviteEmail(pendingRow.id)
      } catch (emailErr) {
        await cancelInvite({ inviteId: pendingRow.id })
        throw emailErr
      }

      await refreshPendingInvites()


      showToast('Invitation sent successfully')
      setInviteEmail('')
      setInviteRole('Analyst')
      setInviteMessage("You've been invited to join the InsightAI workspace.")
      setInviteOpen(false)

    } catch (err) {
      showToast(err?.message || 'Failed to send invitation')
    } finally {
      setIsSending(false)
    }
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
            type="button"
            onClick={() => {
              if (!canInvite) {
                showToast('Only admins can invite members')
                return
              }
              setInviteOpen(true)
            }}
            disabled={!canInvite}
            title={!canInvite ? 'Only admins can invite users' : undefined}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${
              canInvite
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
            }`}
            aria-disabled={!canInvite}
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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="overflow-x-auto overflow-y-visible min-h-[420px] [scrollbar-width:thin]">
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

            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700 [&_td]:overflow-visible">
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
                    currentUserId={currentUserId}
                    actorRole={currentRoleKey}
                    isActionMenuOpen={actionMenuOpen}
                    onActionMenuToggle={setActionMenuOpen}
                    onView={handleViewUser}
                    onEditRole={handleEditRoleOpen}
                    onToggleStatus={handleToggleStatusOpen}
                    onDelete={handleDeleteUserOpen}
                    onResendInviteUI={async (u) => {
                      setActionMenuOpen(null)
                      try {
                        if (!u?.id) throw new Error('Invite id missing')
                        await resendInvite({ inviteId: u.id })
                        await refreshPendingInvites()
                        showToast('Invitation resent')
                      } catch (err) {
                        showToast(err?.message || 'Failed to resend invite')
                      }
                    }}
                    onCancelPendingInviteUI={async (u) => {
                      setActionMenuOpen(null)
                      try {
                        if (!u?.id) throw new Error('Invite id missing')
                        await cancelInvite({ inviteId: u.id })
                        await refreshPendingInvites()
                        showToast('Invitation canceled')
                      } catch (err) {
                        showToast(err?.message || 'Failed to cancel invite')
                      }
                    }}

                    onCopyInviteLinkUI={async (u) => {
                      setActionMenuOpen(null)
                      try {
                        const token =
                          u?.token || (await getInviteToken({ inviteId: u.id }))
                        const link = buildInviteUrl(token)
                        await navigator.clipboard.writeText(link)
                        showToast('Invite link copied')
                      } catch (err) {
                        showToast(err?.message || 'Failed to copy invite link')
                      }
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
                  {isAdmin && <option value="Admin">Admin</option>}
                  <option value="Manager">Manager</option>
                  <option value="Analyst">Analyst</option>
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
                      <span className="text-xs text-gray-600 dark:text-gray-300">Manage projects and team operations</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
                        Analyst
                      </span>
                      <span className="text-xs text-gray-600 dark:text-gray-300">Access analytics, dashboards, and reports</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-800 dark:bg-slate-900/40 dark:text-slate-200">
                        Viewer
                      </span>
                      <span className="text-xs text-gray-600 dark:text-gray-300">Read-only workspace access</span>
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

              <p className="text-xs text-gray-500 dark:text-gray-400 pt-1">
                An email with an acceptance link will be sent. Invites expire after 7 days.
              </p>
            </form>
          </div>
        </Modal>

        {/* View User Modal */}
        <Modal
          isOpen={!!viewUser}
          onClose={() => setViewUser(null)}
          title="User Details"
        >
          {viewUser && (
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Email</p>
                <p className="text-gray-900 dark:text-white">{viewUser.email || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Role</p>
                <p className="text-gray-900 dark:text-white">{viewUser.role || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Status</p>
                <p className="text-gray-900 dark:text-white">{viewUser.status || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Joined</p>
                <p className="text-gray-900 dark:text-white">{viewUser.joinedAt || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Company</p>
                <p className="text-gray-900 dark:text-white">{viewUser.companyName || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Invited by</p>
                <p className="text-gray-900 dark:text-white font-mono text-xs">
                  {viewUser.invited_by || 'N/A'}
                </p>
              </div>
              <div className="flex justify-end pt-2">
                <Button type="button" variant="secondary" onClick={() => setViewUser(null)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Edit Role Modal */}
        <Modal
          isOpen={!!editUser}
          onClose={() => !actionLoading && setEditUser(null)}
          title="Edit Role"
        >
          {editUser && (
            <form onSubmit={handleSaveRole} className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Update role for <span className="font-medium">{editUser.displayName}</span>
              </p>
              <select
                value={editRoleValue}
                onChange={(e) => setEditRoleValue(e.target.value)}
                disabled={actionLoading}
                className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                {editableRolesForModal.map((role) => (
                  <option key={role} value={role}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </option>
                ))}
              </select>
              <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={actionLoading}
                  onClick={() => setEditUser(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" loading={actionLoading} disabled={actionLoading}>
                  Save
                </Button>
              </div>
            </form>
          )}
        </Modal>

        {/* Suspend / Activate Confirmation */}
        <Modal
          isOpen={!!confirmSuspendUser}
          onClose={() => !actionLoading && setConfirmSuspendUser(null)}
          title={
            confirmSuspendUser?.status === 'Inactive' ||
            confirmSuspendUser?.membership_status === 'inactive'
              ? 'Activate User'
              : 'Suspend User'
          }
        >
          {confirmSuspendUser && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {confirmSuspendUser?.status === 'Inactive' ||
                confirmSuspendUser?.membership_status === 'inactive'
                  ? `Activate ${confirmSuspendUser.displayName}? They will regain dashboard access.`
                  : `Are you sure you want to suspend ${confirmSuspendUser.displayName}? They will lose dashboard access.`}
              </p>
              <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={actionLoading}
                  onClick={() => setConfirmSuspendUser(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  loading={actionLoading}
                  disabled={actionLoading}
                  onClick={handleConfirmSuspend}
                >
                  Confirm
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Remove User Confirmation */}
        <Modal
          isOpen={!!confirmRemoveUser}
          onClose={() => !actionLoading && setConfirmRemoveUser(null)}
          title="Remove User"
        >
          {confirmRemoveUser && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Remove <span className="font-medium">{confirmRemoveUser.displayName}</span> from this
                workspace? This does not delete their auth account.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={actionLoading}
                  onClick={() => setConfirmRemoveUser(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  loading={actionLoading}
                  disabled={actionLoading}
                  onClick={handleConfirmRemove}
                  className="bg-red-600 hover:bg-red-700 focus:ring-red-500/30"
                >
                  Remove
                </Button>
              </div>
            </div>
          )}
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

export default function DataTable() {
  return (
    <FeatureGate feature="team_management">
      <DataTableContent />
    </FeatureGate>
  )
}

