import { useSelector } from 'react-redux'
import { useSubscription } from '../../../services/subscriptionService'
import { canPerformWriteAction } from '../../../utils/subscriptionAccess'

export function useTeamPermissions() {
  const profile = useSelector(state => state.profile.profile)
  const currentUserId = useSelector(state => state.auth.user?.id)
  const currentRole = profile?.role
  const currentRoleKey = String(currentRole || '').toLowerCase().trim()
  const companyId = profile?.company_id
  const { data: subscription } = useSubscription(companyId)
  const canWrite = canPerformWriteAction(subscription)
  const canInvite = currentRoleKey === 'admin' && canWrite
  const isAdmin = currentRoleKey === 'admin'

  return { profile, currentUserId, currentRoleKey, companyId, canWrite, canInvite, isAdmin }
}
