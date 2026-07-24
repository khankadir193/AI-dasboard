import { supabase } from '../lib/supabaseClient'
import { createNotification } from './notificationsService'
import { logActivity, ACTIONS, RESOURCE_TYPES } from './activityLogService'

const ALLOWED_ROLES = new Set(['admin', 'manager', 'analyst', 'viewer'])

const validateRole = (role) => {
  if (!role) return false
  return ALLOWED_ROLES.has(String(role).toLowerCase())
}

const toDbRole = (role) => String(role || '').toLowerCase()

const normalizeEmail = (email) => String(email || '').trim().toLowerCase()

export const buildInviteUrl = (token) => {
  if (!token) return ''
  const base =
    import.meta.env.VITE_APP_URL ||
    (typeof window !== 'undefined' ? window.location.origin : '')
  return `${String(base).replace(/\/$/, '')}/invite/${encodeURIComponent(token)}`
}

export const sendInviteEmail = async (inviteId) => {
  if (!inviteId) throw new Error('Invite id missing')

  const { data, error } = await supabase.functions.invoke('send-invite-email', {
    body: { inviteId }
  })

  if (error) {
    throw new Error(error.message || 'Failed to send invite email')
  }

  if (data && data.ok === false) {
    throw new Error(data.error || 'Failed to send invite email')
  }

  return data
}

const toPendingRowShape = (invite) => {
  const createdAt = invite?.created_at
  return {
    id: invite?.id,
    token: invite?.token,
    formattedId: `#INV-${invite?.id?.slice?.(0, 6)?.toUpperCase?.() || 'N/A'}`,
    displayName: (invite?.email || '').split('@')[0] || 'Pending Member',
    initials: ((invite?.email || '')
      .split('@')[0] || 'U')
      .replace(/[._-]/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .split(' ')
      .filter(Boolean)
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'U',
    email: invite?.email,
    companyName: 'Pending invite',
    role: (invite?.role || 'viewer')
      .charAt(0)
      .toUpperCase() + (invite?.role || 'viewer').slice(1),
    roleKey: toDbRole(invite?.role),
    roleClass:
      (invite?.role || 'viewer') === 'admin'
        ? 'bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100'
        : (invite?.role || 'viewer') === 'manager'
          ? 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100'
          : (invite?.role || 'viewer') === 'analyst'
            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-800 dark:text-emerald-100'
            : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100',
    status: 'Pending',
    statusClass: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200',
    joinedAt: createdAt
      ? new Date(createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
      : 'N/A',
    avatarGradient: 'from-amber-400 to-amber-600',
    isActive: false
  }
}

export const getPendingInvitesForCompany = async (companyId) => {
  if (!companyId) return []

  const { data, error } = await supabase
    .from('invites')
    .select('*')
    .eq('company_id', companyId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message || 'Failed to fetch pending invites')

  return (data || []).map(toPendingRowShape)
}

async function assertNotActiveMember(companyId, email) {
  // Use ilike for case-insensitive email matching since PostgreSQL = is case-sensitive
  const { data: member, error: memberErr } = await supabase
    .from('company_members')
    .select('user_id')
    .eq('company_id', companyId)
    .ilike('email', email)
    .eq('status', 'active')
    .maybeSingle()

  if (memberErr && !memberErr.message?.includes('permission')) {
    throw new Error(memberErr.message || 'Failed to validate existing membership')
  }

  if (member?.user_id) {
    throw new Error('This user is already an active member of the workspace.')
  }
}

export const createInvite = async ({ email, role, companyId }) => {
  if (!companyId) throw new Error('Company not set')

  const normalizedEmail = normalizeEmail(email)
  if (!normalizedEmail) throw new Error('Email is required')

  const normalizedRole = toDbRole(role)
  if (!validateRole(normalizedRole)) {
    throw new Error('Invalid role')
  }

  const {
    data: { user },
    error: authErr
  } = await supabase.auth.getUser()

  if (authErr) throw new Error(authErr.message)
  if (!user?.id) throw new Error('Not authenticated')

  // Business-logic protection: only admins can create invitations
  const { data: actorProfile, error: actorProfileErr } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (actorProfileErr) {
    throw new Error(actorProfileErr.message || 'Failed to validate permissions')
  }

  const actorRole = toDbRole(actorProfile?.role)
  if (actorRole !== 'admin') {
    throw new Error('Only admins can invite members')
  }

  await assertNotActiveMember(companyId, normalizedEmail)

  const token = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()


  const { data: existing, error: existingErr } = await supabase
    .from('invites')
    .select('id')
    .eq('company_id', companyId)
    .eq('email', normalizedEmail)
    .eq('status', 'pending')
    .maybeSingle()

  if (existingErr) {
    throw new Error(existingErr.message || 'Failed to validate duplicate invite')
  }

  if (existing?.id) {
    throw new Error('User already has a pending invite.')
  }

  const { data, error } = await supabase
    .from('invites')
    .insert({
      email: normalizedEmail,
      role: normalizedRole,
      company_id: companyId,
      token,
      status: 'pending',
      created_by: user.id,
      expires_at: expiresAt
    })
    .select('*')
    .maybeSingle()

  if (error) throw new Error(error.message || 'Failed to create invite')
  if (!data) throw new Error('Failed to create invite')

  createNotification({
    companyId,
    userId: user.id,
    type: 'user_invited',
    title: 'User Invited',
    message: `${normalizedEmail} has been invited as ${normalizedRole}.`,
    priority: 'medium',
    resourceType: 'invite',
    resourceId: data.id,
    metadata: { email: normalizedEmail, role: normalizedRole }
  }).catch(err => console.error('[invitesService] createNotification failed:', err))

  // Business-event log: INVITE_SEND (fire-and-forget — non-blocking)
  logActivity({
    companyId,
    userId: user.id,
    action: ACTIONS.INVITE_SEND,
    resourceType: RESOURCE_TYPES.INVITE,
    resourceId: data.id,
    description: `Invitation sent to ${normalizedEmail} with role ${normalizedRole}`,
    metadata: { email: normalizedEmail, role: normalizedRole }
  })

  return toPendingRowShape(data)
}

export const cancelInvite = async ({ inviteId, companyId }) => {
  if (!inviteId) throw new Error('Invite id missing')

  // Only cancel pending invites to prevent side effects on already-processed invites
  let query = supabase
    .from('invites')
    .update({ status: 'cancelled' })
    .eq('id', inviteId)
    .eq('status', 'pending')

  if (companyId) query = query.eq('company_id', companyId)

  const { data, error } = await query.select('id').maybeSingle()

  if (error) throw new Error(error.message || 'Failed to cancel invite')
  if (!data) throw new Error('Invite is no longer pending')
  return data
}

export const resendInvite = async ({ inviteId, companyId }) => {
  if (!inviteId) throw new Error('Invite id missing')

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  // Only allow resending for pending invites — prevents reactivating accepted ones
  let fetchQuery = supabase
    .from('invites')
    .select('id, status')
    .eq('id', inviteId)

  if (companyId) fetchQuery = fetchQuery.eq('company_id', companyId)

  const { data: existing, error: fetchErr } = await fetchQuery.maybeSingle()

  if (fetchErr) throw new Error(fetchErr.message || 'Failed to fetch invite')
  if (!existing) throw new Error('Invite not found')
  if (existing.status !== 'pending') {
    throw new Error('Only pending invites can be resent')
  }

  let updateQuery = supabase
    .from('invites')
    .update({ expires_at: expiresAt })
    .eq('id', inviteId)
    .eq('status', 'pending')

  if (companyId) updateQuery = updateQuery.eq('company_id', companyId)

  const { data, error } = await updateQuery.select('id').maybeSingle()

  if (error) throw new Error(error.message || 'Failed to resend invite')
  if (!data) throw new Error('Invite is no longer pending')

  await sendInviteEmail(inviteId)

  return data
}

export const getInviteToken = async ({ inviteId, companyId }) => {
  if (!inviteId) throw new Error('Invite id missing')

  let query = supabase
    .from('invites')
    .select('token, status')
    .eq('id', inviteId)

  if (companyId) query = query.eq('company_id', companyId)

  const { data, error } = await query.maybeSingle()

  if (error) throw new Error(error.message || 'Failed to fetch invite link')
  if (!data?.token) throw new Error('Invite link unavailable')
  if (data.status !== 'pending') throw new Error('Only pending invites have an active link')

  return data.token
}

export const fetchInviteByToken = async (token) => {
  const rawToken = token == null ? '' : String(token)
  const inviteToken = rawToken.trim()

  if (!inviteToken) return null

  // Authoritative source: RPC secured by RLS/SPCL
  // get_invite_for_accept(p_token) returns:
  // id, email, role, company_id, token, status, expires_at, created_by, company_name
  const { data, error } = await supabase.rpc('get_invite_for_accept', {
    p_token: inviteToken
  })

  // Normalize RPC response safely:
  // - If data is an array, use data[0]
  // - If data is null/empty, treat as invalid/expired invite for UI stability
  const row = Array.isArray(data) ? data?.[0] : data
  if (error || !row) return null

  const isExpired = (() => {
    if (!row?.expires_at) return false
    const d = new Date(row.expires_at)
    if (!Number.isFinite(d.getTime())) return false
    return d.getTime() < Date.now()
  })()

  if (isExpired) return null

  return {
    ...row,
    company_name: row?.company_name || ''
  }
}






