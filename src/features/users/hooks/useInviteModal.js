import { useState, useCallback, useMemo } from 'react'
import {
  createInvite,
  sendInviteEmail,
  cancelInvite,
} from '../../../services/invitesService'
import { logActivity, ACTIONS, RESOURCE_TYPES } from '../../../services/activityLogService'

export function useInviteModal({
  companyId,
  canInvite,
  profile,
  refreshPendingInvites,
  showToast,
}) {
  const [isInviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('Analyst')
  const [inviteMessage, setInviteMessage] = useState("You've been invited to join the InsightAI workspace.")
  const [isSending, setIsSending] = useState(false)

  const validateEmail = useCallback((value) => {
    if (!value) return false
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  }, [])

  const inviteEmailError = useMemo(
    () => (inviteEmail ? (validateEmail(inviteEmail) ? '' : 'Enter a valid email address') : ''),
    [inviteEmail, validateEmail]
  )

  const closeInvite = useCallback(() => {
    if (isSending) return
    setInviteOpen(false)
  }, [isSending])

  const handleSendInvite = useCallback(async (e) => {
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

      const pendingRow = await createInvite({
        email: inviteEmail.trim(),
        role: dbRole,
        companyId,
      })

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
        metadata: { email: inviteEmail.trim(), role: dbRole },
      })

      try {
        await sendInviteEmail(pendingRow.id)
      } catch (emailErr) {
        await cancelInvite({ inviteId: pendingRow.id, companyId })
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
  }, [isSending, canInvite, companyId, inviteEmail, inviteRole, validateEmail, profile, refreshPendingInvites, showToast])

  return {
    isInviteOpen,
    setInviteOpen,
    inviteEmail,
    setInviteEmail,
    inviteRole,
    setInviteRole,
    inviteMessage,
    setInviteMessage,
    isSending,
    inviteEmailError,
    handleSendInvite,
    closeInvite,
  }
}
