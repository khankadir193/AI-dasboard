import { useState, useCallback, useMemo } from 'react'
import { useDispatch } from 'react-redux'
import {
  updateUserRole,
  updateMemberStatus,
  removeMember,
} from '../../../store/slices/usersSlice'
import {
  getEditableRolesForActor,
  canEditTargetMember,
} from '../../../utils/teamPermissions'

export function useMemberActions({
  currentRoleKey,
  currentUserId,
  canWrite,
  companyId,
  refreshUsers,
  showToast,
  setActionMenuOpen,
}) {
  const dispatch = useDispatch()

  const [viewUser, setViewUser] = useState(null)
  const [editUser, setEditUser] = useState(null)
  const [editRoleValue, setEditRoleValue] = useState('viewer')
  const [confirmSuspendUser, setConfirmSuspendUser] = useState(null)
  const [confirmRemoveUser, setConfirmRemoveUser] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)

  const handleViewUser = useCallback((user) => {
    setViewUser(user)
    setActionMenuOpen(null)
  }, [setActionMenuOpen])

  const handleEditRoleOpen = useCallback((user) => {
    if (!canWrite) {
      showToast('Subscription required. Upgrade to edit member roles.')
      setActionMenuOpen(null)
      return
    }
    if (!canEditTargetMember(currentRoleKey, user?.roleKey || user?.role)) {
      showToast('You do not have permission to edit this member')
      setActionMenuOpen(null)
      return
    }
    setEditUser(user)
    setEditRoleValue(String(user?.roleKey || user?.role || 'viewer').toLowerCase())
    setActionMenuOpen(null)
  }, [canWrite, currentRoleKey, showToast, setActionMenuOpen])

  const handleSaveRole = useCallback(async (e) => {
    e?.preventDefault?.()
    if (!editUser?.id || actionLoading) return

    setActionLoading(true)
    try {
      await dispatch(updateUserRole({ userId: editUser.id, role: editRoleValue, companyId })).unwrap()
      await refreshUsers()
      showToast('Role updated successfully')
      setEditUser(null)
    } catch (err) {
      showToast(typeof err === 'string' ? err : err?.message || 'Failed to update role')
    } finally {
      setActionLoading(false)
    }
  }, [editUser, actionLoading, editRoleValue, companyId, dispatch, refreshUsers, showToast])

  const handleToggleStatusOpen = useCallback((user) => {
    if (!canWrite) {
      showToast('Subscription required. Upgrade to manage member status.')
      setActionMenuOpen(null)
      return
    }
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
  }, [canWrite, currentUserId, currentRoleKey, showToast, setActionMenuOpen])

  const handleConfirmSuspend = useCallback(async () => {
    if (!confirmSuspendUser?.id || actionLoading) return

    const isInactive =
      confirmSuspendUser?.status === 'Inactive' ||
      confirmSuspendUser?.membership_status === 'inactive'
    const nextStatus = isInactive ? 'active' : 'inactive'

    setActionLoading(true)
    try {
      await dispatch(updateMemberStatus({ userId: confirmSuspendUser.id, status: nextStatus, companyId })).unwrap()
      await refreshUsers()
      showToast(isInactive ? 'User activated successfully' : 'User suspended successfully')
      setConfirmSuspendUser(null)
    } catch (err) {
      showToast(typeof err === 'string' ? err : err?.message || 'Failed to update user status')
    } finally {
      setActionLoading(false)
    }
  }, [confirmSuspendUser, actionLoading, companyId, dispatch, refreshUsers, showToast])

  const handleDeleteUserOpen = useCallback((user) => {
    if (!canWrite) {
      showToast('Subscription required. Upgrade to remove members.')
      setActionMenuOpen(null)
      return
    }
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
  }, [canWrite, currentUserId, currentRoleKey, showToast, setActionMenuOpen])

  const handleConfirmRemove = useCallback(async () => {
    if (!confirmRemoveUser?.id || actionLoading) return

    setActionLoading(true)
    try {
      await dispatch(removeMember({ userId: confirmRemoveUser.id, companyId })).unwrap()
      await refreshUsers()
      showToast('User removed from workspace')
      setConfirmRemoveUser(null)
    } catch (err) {
      showToast(typeof err === 'string' ? err : err?.message || 'Failed to remove user')
    } finally {
      setActionLoading(false)
    }
  }, [confirmRemoveUser, actionLoading, companyId, dispatch, refreshUsers, showToast])

  const editableRolesForModal = useMemo(
    () => (editUser ? getEditableRolesForActor(currentRoleKey, editUser.roleKey || editUser.role) : []),
    [editUser, currentRoleKey]
  )

  return {
    viewUser, setViewUser,
    editUser, setEditUser,
    editRoleValue, setEditRoleValue,
    confirmSuspendUser, setConfirmSuspendUser,
    confirmRemoveUser, setConfirmRemoveUser,
    actionLoading,
    editableRolesForModal,
    handleViewUser,
    handleEditRoleOpen,
    handleSaveRole,
    handleToggleStatusOpen,
    handleConfirmSuspend,
    handleDeleteUserOpen,
    handleConfirmRemove,
  }
}
