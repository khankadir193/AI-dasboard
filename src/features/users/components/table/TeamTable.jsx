import {
  TableLoadingState,
  TableErrorState,
  TableEmptyState,
} from '../TableStates'
import { SortableTableHeader } from '../SortableTableHeader'
import { UserTableRow } from '../UserTableRow'
import { TablePagination } from '../TablePagination'

export function TeamTable({
  isLoading,
  error,
  paginated,
  columns,
  sortField,
  sortDir,
  onSort,
  currentUserId,
  currentRoleKey,
  actionMenuOpen,
  onActionMenuToggle,
  onView,
  onEditRole,
  onToggleStatus,
  onDelete,
  onResendInviteAction,
  onCancelInviteAction,
  onCopyInviteLinkAction,
  sortedUsers,
  pageSize,
  page,
  totalPages,
  setPage,
  users,
  pendingInvites,
  onClearFilters,
  onOpenInvite,
}) {
  return (
    <>
      <div className="overflow-x-auto overflow-y-visible min-h-[420px] [scrollbar-width:thin]">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
          <SortableTableHeader
            columns={columns}
            sortField={sortField}
            sortDir={sortDir}
            onSort={onSort}
          />

          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700 [&_td]:overflow-visible">
            {isLoading ? (
              <TableLoadingState />
            ) : error ? (
              <TableErrorState error={error} />
            ) : paginated.length === 0 ? (
              <TableEmptyState
                onClearFilters={onClearFilters}
                onInvite={
                  (users?.length || 0) === 0 && (pendingInvites?.length || 0) === 0
                    ? onOpenInvite
                    : undefined
                }
              />
            ) : (
              paginated.map((user) => (
                <UserTableRow
                  key={user?.id ?? user?.formattedId}
                  user={user}
                  currentUserId={currentUserId}
                  actorRole={currentRoleKey}
                  isActionMenuOpen={actionMenuOpen}
                  onActionMenuToggle={onActionMenuToggle}
                  onView={onView}
                  onEditRole={onEditRole}
                  onToggleStatus={onToggleStatus}
                  onDelete={onDelete}
                  onResendInviteUI={onResendInviteAction}
                  onCancelPendingInviteUI={onCancelInviteAction}
                  onCopyInviteLinkUI={onCopyInviteLinkAction}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {!isLoading && sortedUsers.length > 0 && (
        <TablePagination
          page={page}
          totalPages={totalPages}
          totalItems={sortedUsers.length}
          pageSize={pageSize}
          onPageChange={setPage}
          isDisabled={false}
        />
      )}
    </>
  )
}
