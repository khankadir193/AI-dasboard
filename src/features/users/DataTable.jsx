import { Plus } from 'lucide-react'
import { useMemo } from 'react'

import { useActionMenu } from './useTableHooks'
import {
  useTableFilters,
  useTableSort,
  useTablePagination,
  useTableFiltering,
  useTableSorting,
} from './useTableHooks'
import { PAGE_SIZE, TABLE_COLUMNS } from './tableConstants'
import { ExportMenu } from './components/ExportMenu'
import { FilterBar } from './components/FilterBar'
import { TeamTable } from './components/table/TeamTable'
import { InviteMemberModal } from './components/modals/InviteMemberModal'
import { ViewMemberModal } from './components/modals/ViewMemberModal'
import { EditRoleModal } from './components/modals/EditRoleModal'
import { SuspendMemberModal } from './components/modals/SuspendMemberModal'
import { RemoveMemberModal } from './components/modals/RemoveMemberModal'
import FeatureGate from '../../components/auth/FeatureGate'

import { useTeamPermissions } from './hooks/useTeamPermissions'
import { useTeamMembers } from './hooks/useTeamMembers'
import { useToast } from './hooks/useToast'
import { useInvites } from './hooks/useInvites'
import { useMemberActions } from './hooks/useMemberActions'
import { useInviteModal } from './hooks/useInviteModal'
import { useExportUsers } from './hooks/useExportUsers'

function DataTableContent() {
  const { profile, currentUserId, currentRoleKey, companyId, canWrite, canInvite, isAdmin } =
    useTeamPermissions()

  const { users, isLoading, error, refreshUsers } = useTeamMembers()
  const { toast, showToast } = useToast()
  const {
    pendingInvites,
    isInvitesLoading,
    refreshPendingInvites,
    handleResendInvite,
    handleCancelInvite,
    handleCopyInviteLink,
  } = useInvites({ companyId, showToast })

  const { actionMenuOpen, setActionMenuOpen } = useActionMenu()

  const memberActions = useMemberActions({
    currentRoleKey,
    currentUserId,
    canWrite,
    companyId,
    refreshUsers,
    showToast,
    setActionMenuOpen,
  })

  const inviteModal = useInviteModal({
    companyId,
    canInvite,
    profile,
    refreshPendingInvites,
    showToast,
  })

  const filterState = useTableFilters()
  const sortState = useTableSort()

  const displayUsers = useMemo(
    () => [...pendingInvites, ...(users || [])],
    [pendingInvites, users]
  )

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

  const pagination = useTablePagination(sortedUsers, PAGE_SIZE)

  const { handleExportCSV, handleExportExcel, handleExportPDF } = useExportUsers(sortedUsers)

  const wrapInviteAction = (fn) => (user) => {
    setActionMenuOpen(null)
    fn(user)
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
              if (!canWrite) {
                showToast('Subscription required. Upgrade to invite members.')
                return
              }
              if (currentRoleKey !== 'admin') {
                showToast('Only admins can invite members')
                return
              }
              inviteModal.setInviteOpen(true)
            }}
            disabled={!canInvite}
            title={
              !canWrite
                ? 'Subscription required. Upgrade to Pro.'
                : !canInvite
                  ? 'Only admins can invite users'
                  : undefined
            }
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
        <TeamTable
          isLoading={isLoading}
          error={error}
          paginated={pagination.paginated}
          columns={TABLE_COLUMNS}
          sortField={sortState.sortField}
          sortDir={sortState.sortDir}
          onSort={(field) => {
            sortState.handleSort(field)
            pagination.setPage(1)
          }}
          currentUserId={currentUserId}
          currentRoleKey={currentRoleKey}
          actionMenuOpen={actionMenuOpen}
          onActionMenuToggle={setActionMenuOpen}
          onView={memberActions.handleViewUser}
          onEditRole={memberActions.handleEditRoleOpen}
          onToggleStatus={memberActions.handleToggleStatusOpen}
          onDelete={memberActions.handleDeleteUserOpen}
          onResendInviteAction={wrapInviteAction(handleResendInvite)}
          onCancelInviteAction={wrapInviteAction(handleCancelInvite)}
          onCopyInviteLinkAction={wrapInviteAction(handleCopyInviteLink)}
          sortedUsers={sortedUsers}
          pageSize={PAGE_SIZE}
          page={pagination.page}
          totalPages={pagination.totalPages}
          setPage={pagination.setPage}
          users={users}
          pendingInvites={pendingInvites}
          onClearFilters={filterState.clearFilters}
          onOpenInvite={() => inviteModal.setInviteOpen(true)}
        />

        <InviteMemberModal
          isOpen={inviteModal.isInviteOpen}
          onClose={inviteModal.closeInvite}
          onSendInvite={inviteModal.handleSendInvite}
          inviteEmail={inviteModal.inviteEmail}
          setInviteEmail={inviteModal.setInviteEmail}
          inviteRole={inviteModal.inviteRole}
          setInviteRole={inviteModal.setInviteRole}
          inviteMessage={inviteModal.inviteMessage}
          setInviteMessage={inviteModal.setInviteMessage}
          isSending={inviteModal.isSending}
          inviteEmailError={inviteModal.inviteEmailError}
          isAdmin={isAdmin}
        />

        <ViewMemberModal
          isOpen={!!memberActions.viewUser}
          onClose={() => memberActions.setViewUser(null)}
          user={memberActions.viewUser}
        />

        <EditRoleModal
          isOpen={!!memberActions.editUser}
          onClose={() => memberActions.setEditUser(null)}
          user={memberActions.editUser}
          roleValue={memberActions.editRoleValue}
          onRoleChange={memberActions.setEditRoleValue}
          editableRoles={memberActions.editableRolesForModal}
          isLoading={memberActions.actionLoading}
          onSave={memberActions.handleSaveRole}
        />

        <SuspendMemberModal
          isOpen={!!memberActions.confirmSuspendUser}
          onClose={() => memberActions.setConfirmSuspendUser(null)}
          user={memberActions.confirmSuspendUser}
          isLoading={memberActions.actionLoading}
          onConfirm={memberActions.handleConfirmSuspend}
        />

        <RemoveMemberModal
          isOpen={!!memberActions.confirmRemoveUser}
          onClose={() => memberActions.setConfirmRemoveUser(null)}
          user={memberActions.confirmRemoveUser}
          isLoading={memberActions.actionLoading}
          onConfirm={memberActions.handleConfirmRemove}
        />

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
