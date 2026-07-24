import { supabase } from '../lib/supabaseClient'
import { logActivity, ACTIONS, RESOURCE_TYPES } from './activityLogService'

const ALLOWED_ROLES = new Set(['admin', 'manager', 'analyst', 'viewer'])
const ALLOWED_STATUSES = new Set(['active', 'inactive', 'removed'])

const normalizeRole = (role) => {
  const r = String(role || '').toLowerCase().trim()
  return ALLOWED_ROLES.has(r) ? r : 'viewer'
}

async function getAuthContext() {
  const {
    data: { user: authUser },
    error: authUserError
  } = await supabase.auth.getUser()

  if (authUserError) throw new Error(authUserError.message)
  if (!authUser?.id) return null

  const { data: myProfile, error: myProfileError } = await supabase
    .from('profiles')
    .select('id, company_id, role')
    .eq('id', authUser.id)
    .maybeSingle()

  if (myProfileError) throw new Error(myProfileError.message || 'Failed to fetch profile')
  if (!myProfile?.company_id) return null

  return { authUser, myProfile, companyId: myProfile.company_id }
}

export async function fetchMyMembership(userId, companyId) {
  if (!userId || !companyId) return null

  const { data, error } = await supabase
    .from('company_members')
    .select('id, company_id, user_id, role, status')
    .eq('user_id', userId)
    .eq('company_id', companyId)
    .maybeSingle()

  if (error) throw new Error(error.message || 'Failed to fetch membership')
  return data
}

async function countActiveAdmins(companyId) {
  const { count, error } = await supabase
    .from('company_members')
    .select('id', { count: 'exact', head: true })
    .eq('company_id', companyId)
    .eq('role', 'admin')
    .eq('status', 'active')

  if (error) throw new Error(error.message || 'Failed to count admins')
  return count ?? 0
}

/**
 * Fetch all active team members for the current user's company
 */
export const fetchAllUsers = async () => {
  const ctx = await getAuthContext()
  if (!ctx) return []

  const { companyId } = ctx

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select(`
      *,
      companies:company_id (
        id,
        name
      )
    `)
    .eq('company_id', companyId)

  if (error) throw new Error(error.message || 'Failed to fetch users')

  const { data: members, error: membersError } = await supabase
    .from('company_members')
    .select('id, user_id, email, role, status, invited_by, joined_at, created_at')
    .eq('company_id', companyId)
    .neq('status', 'removed')

  if (membersError) throw new Error(membersError.message || 'Failed to fetch company members')

  const memberByUserId = Object.fromEntries((members || []).map((m) => [m.user_id, m]))

  const users = (profiles || [])
    .filter((profile) => {
      const member = memberByUserId[profile.id]
      return !member || member.status !== 'removed'
    })
    .map((profile) => {
      const member = memberByUserId[profile.id]
      const email = profile?.email || member?.email || ''

      const first = (profile?.first_name || '').trim()
      const last = (profile?.last_name || '').trim()
      const fullName = [first, last].filter(Boolean).join(' ').trim()

      const emailPrefix = email.split('@')[0] || 'user'
      const fallbackName = emailPrefix
        .replace(/[._-]/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase())

      const displayName = fullName || fallbackName || 'Unknown'

      const companyData = profile?.companies
      const companyObj = Array.isArray(companyData) ? companyData[0] : companyData
      const companyName = companyObj?.name ?? null

      const membershipStatus = member?.status || (profile.is_active !== false ? 'active' : 'inactive')
      const role = member?.role || profile.role || 'viewer'

      return {
        id: profile.id,
        memberId: member?.id || null,
        email,
        role,
        membership_status: membershipStatus,
        is_active: membershipStatus === 'active',
        created_at: member?.joined_at || member?.created_at || profile.created_at,
        company_id: profile.company_id,
        permissions: profile.permissions,
        avatar_url: profile.avatar_url,
        updated_at: profile.updated_at,
        invited_by: member?.invited_by || null,
        displayName,
        company: { name: companyName }
      }
    })

  return users
}

async function syncProfileRole(userId, role) {
  const { error } = await supabase.from('profiles').update({ role }).eq('id', userId)
  if (error) throw new Error(error.message || 'Failed to sync profile role')
}

async function syncProfileActive(userId, isActive) {
  const { error } = await supabase.from('profiles').update({ is_active: isActive }).eq('id', userId)
  if (error) throw new Error(error.message || 'Failed to sync profile status')
}

/**
 * Update member role in company_members and profiles
 */
export const updateUserRole = async ({ userId, role, companyId }) => {
  console.log('[EditRole] service payload:', { userId, role, companyId })

  const ctx = await getAuthContext()
  if (!ctx) throw new Error('Not authenticated')

  const normalizedRole = normalizeRole(role)
  const targetCompanyId = companyId || ctx.companyId

  const { data: member, error: memberFetchErr } = await supabase
    .from('company_members')
    .select('id, role, status')
    .eq('company_id', targetCompanyId)
    .eq('user_id', userId)
    .maybeSingle()

  if (memberFetchErr) throw new Error(memberFetchErr.message || 'Failed to fetch member')
  if (!member?.id) throw new Error('Member not found')
  if (member.status === 'removed') throw new Error('Cannot edit a removed member')

  if (member.role === 'admin' && normalizedRole !== 'admin') {
    const adminCount = await countActiveAdmins(targetCompanyId)
    if (adminCount <= 1) throw new Error('Cannot change role of the last active admin')
  }

  const { data: updatedMember, error: memberErr } = await supabase
    .from('company_members')
    .update({ role: normalizedRole })
    .eq('id', member.id)
    .select()
    .maybeSingle()

  if (memberErr) throw new Error(memberErr.message || 'Failed to update member role')

  try {
    await syncProfileRole(userId, normalizedRole)
  } catch (profileErr) {
    await supabase.from('company_members').update({ role: member.role }).eq('id', member.id)
    throw profileErr
  }

  // Business-event log: ROLE_UPDATE (fire-and-forget — non-blocking)
  logActivity({
    companyId: targetCompanyId,
    userId: ctx.myProfile.id,
    action: ACTIONS.ROLE_UPDATE,
    resourceType: RESOURCE_TYPES.MEMBER,
    resourceId: userId,
    description: `Role updated to ${normalizedRole} for user ${userId}`,
    metadata: { targetUserId: userId, previousRole: member.role, newRole: normalizedRole }
  })

  return { id: userId, role: normalizedRole, membership_status: member.status }
}

/**
 * Suspend or activate a member
 */
export const updateMemberStatus = async ({ userId, status, companyId }) => {
  console.log('[SuspendUser] service payload:', { userId, status, companyId })

  const ctx = await getAuthContext()
  if (!ctx) throw new Error('Not authenticated')

  const nextStatus = String(status || '').toLowerCase()
  if (!ALLOWED_STATUSES.has(nextStatus) || nextStatus === 'removed') {
    throw new Error('Invalid status')
  }

  const targetCompanyId = companyId || ctx.companyId

  const { data: member, error: memberFetchErr } = await supabase
    .from('company_members')
    .select('id, role, status')
    .eq('company_id', targetCompanyId)
    .eq('user_id', userId)
    .maybeSingle()

  if (memberFetchErr) throw new Error(memberFetchErr.message || 'Failed to fetch member')
  if (!member?.id) throw new Error('Member not found')
  if (member.status === 'removed') throw new Error('Cannot update a removed member')

  if (nextStatus !== 'active' && member.role === 'admin') {
    const adminCount = await countActiveAdmins(targetCompanyId)
    if (adminCount <= 1) throw new Error('Cannot suspend or deactivate the last active admin')
  }

  const previousStatus = member.status

  const { error: memberErr } = await supabase
    .from('company_members')
    .update({ status: nextStatus })
    .eq('id', member.id)

  if (memberErr) throw new Error(memberErr.message || 'Failed to update member status')

  try {
    await syncProfileActive(userId, nextStatus === 'active')
  } catch (profileErr) {
    await supabase.from('company_members').update({ status: previousStatus }).eq('id', member.id)
    throw profileErr
  }

  return {
    id: userId,
    membership_status: nextStatus,
    is_active: nextStatus === 'active'
  }
}

/**
 * Soft-remove a member from the company
 */
export const removeMember = async ({ userId, companyId }) => {
  console.log('[RemoveUser] service payload:', { userId, companyId })

  const ctx = await getAuthContext()
  if (!ctx) throw new Error('Not authenticated')

  const targetCompanyId = companyId || ctx.companyId

  const { data: member, error: memberFetchErr } = await supabase
    .from('company_members')
    .select('id, role, status')
    .eq('company_id', targetCompanyId)
    .eq('user_id', userId)
    .maybeSingle()

  if (memberFetchErr) throw new Error(memberFetchErr.message || 'Failed to fetch member')
  if (!member?.id) throw new Error('Member not found')

  if (member.role === 'admin') {
    const adminCount = await countActiveAdmins(targetCompanyId)
    if (adminCount <= 1) throw new Error('Cannot remove the last active admin')
  }

  const { error: memberErr } = await supabase
    .from('company_members')
    .update({ status: 'removed' })
    .eq('id', member.id)

  if (memberErr) throw new Error(memberErr.message || 'Failed to remove member')

  try {
    await syncProfileActive(userId, false)
  } catch (profileErr) {
    await supabase.from('company_members').update({ status: member.status }).eq('id', member.id)
    throw profileErr
  }

  // Business-event log: MEMBER_REMOVE (fire-and-forget — non-blocking)
  logActivity({
    companyId: targetCompanyId,
    userId: ctx.myProfile.id,
    action: ACTIONS.MEMBER_REMOVE,
    resourceType: RESOURCE_TYPES.MEMBER,
    resourceId: userId,
    description: `Member ${userId} removed from company`,
    metadata: { targetUserId: userId }
  })

  return { id: userId, removed: true }
}

/** @deprecated Use updateMemberStatus */
export const toggleUserStatus = async ({ userId, is_active, companyId }) => {
  return updateMemberStatus({
    userId,
    status: is_active ? 'active' : 'inactive',
    companyId
  })
}
