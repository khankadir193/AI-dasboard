import { supabase } from '../lib/supabaseClient'

const ALLOWED_ROLES = new Set(['admin', 'manager', 'analyst', 'viewer'])

const validateRole = (role) => {
  if (!role) return false
  return ALLOWED_ROLES.has(String(role).toLowerCase())
}

const toDbRole = (role) => String(role || '').toLowerCase()

const toPendingRowShape = (invite) => {
  // Keep mapping minimal and compatible with existing UserTableRow expectations
  const createdAt = invite?.created_at
  return {
    id: invite?.id,
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
    joinedAt: createdAt ? new Date(createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A',
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

export const createInvite = async ({ email, role, companyId }) => {
  if (!companyId) throw new Error('Company not set')
  if (!email) throw new Error('Email is required')

  const normalizedRole = toDbRole(role)
  if (!validateRole(normalizedRole)) {
    throw new Error('Invalid role')
  }

  // Fetch auth user id to populate created_by
  const {
    data: { user },
    error: authErr
  } = await supabase.auth.getUser()

  if (authErr) throw new Error(authErr.message)
  if (!user?.id) throw new Error('Not authenticated')

  const token = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  // Prevent duplicate pending invites for same email + company
  const { data: existing, error: existingErr } = await supabase
    .from('invites')
    .select('id')
    .eq('company_id', companyId)
    .eq('email', email)
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
      email,
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

  return toPendingRowShape(data)
}

export const cancelInvite = async ({ inviteId }) => {
  if (!inviteId) throw new Error('Invite id missing')

  const { data, error } = await supabase
    .from('invites')
    .update({ status: 'cancelled' })
    .eq('id', inviteId)
    .select('id')
    .maybeSingle()

  if (error) throw new Error(error.message || 'Failed to cancel invite')
  return data
}

export const resendInvite = async ({ inviteId }) => {
  if (!inviteId) throw new Error('Invite id missing')

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  const { data, error } = await supabase
    .from('invites')
    .update({ expires_at: expiresAt, status: 'pending' })
    .eq('id', inviteId)
    .select('id')
    .maybeSingle()

  if (error) throw new Error(error.message || 'Failed to resend invite')
  return data
}

