import { useState, useEffect, useCallback } from 'react'
import {
  getPendingInvitesForCompany,
  resendInvite,
  cancelInvite,
  getInviteToken,
  buildInviteUrl,
} from '../../../services/invitesService'

export function useInvites({ companyId, showToast }) {
  const [pendingInvites, setPendingInvites] = useState([])
  const [isInvitesLoading, setIsInvitesLoading] = useState(false)

  const refreshPendingInvites = useCallback(async () => {
    if (!companyId) return
    setIsInvitesLoading(true)
    try {
      const rows = await getPendingInvitesForCompany(companyId)
      setPendingInvites(rows)
    } catch (err) {
      console.error('Failed to fetch pending invites', err)
    } finally {
      setIsInvitesLoading(false)
    }
  }, [companyId])

  useEffect(() => {
    refreshPendingInvites()
  }, [refreshPendingInvites])

  const handleResendInvite = useCallback(async (user) => {
    try {
      if (!user?.id) throw new Error('Invite id missing')
      await resendInvite({ inviteId: user.id, companyId })
      await refreshPendingInvites()
      showToast('Invitation resent')
    } catch (err) {
      showToast(err?.message || 'Failed to resend invite')
    }
  }, [refreshPendingInvites, showToast])

  const handleCancelInvite = useCallback(async (user) => {
    try {
      if (!user?.id) throw new Error('Invite id missing')
      await cancelInvite({ inviteId: user.id, companyId })
      await refreshPendingInvites()
      showToast('Invitation canceled')
    } catch (err) {
      showToast(err?.message || 'Failed to cancel invite')
    }
  }, [refreshPendingInvites, showToast])

  const handleCopyInviteLink = useCallback(async (user) => {
    try {
      const token = user?.token || (await getInviteToken({ inviteId: user.id, companyId }))
      const link = buildInviteUrl(token)
      await navigator.clipboard.writeText(link)
      showToast('Invite link copied')
    } catch (err) {
      showToast(err?.message || 'Failed to copy invite link')
    }
  }, [showToast])

  return {
    pendingInvites,
    isInvitesLoading,
    refreshPendingInvites,
    handleResendInvite,
    handleCancelInvite,
    handleCopyInviteLink,
  }
}
