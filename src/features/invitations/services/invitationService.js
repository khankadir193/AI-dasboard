import { supabase } from '../../../lib/supabaseClient'
import { normalizeEmail, isInviteExpired } from '../utils/inviteValidation'

const SESSION_POLL_INTERVAL_MS = 300
const SESSION_MAX_WAIT_MS = 15000
const PROFILE_VERIFY_INTERVAL_MS = 500
const PROFILE_VERIFY_MAX_WAIT_MS = 15000

const log = (event, data) => {
  console.log(`[InviteFlow] ${event}`, data || '')
}

export async function waitForAuthenticatedSession() {
  const deadline = Date.now() + SESSION_MAX_WAIT_MS
  let lastError = null
  while (Date.now() < deadline) {
    const { data: sessionData, error } = await supabase.auth.getSession()
    const authUser = sessionData?.session?.user
    if (authUser?.id) {
      log('session_ready', { userId: authUser.id, email: authUser.email })
      return { sessionData, authUser }
    }
    if (error) {
      lastError = error
    }
    await new Promise((resolve) => setTimeout(resolve, SESSION_POLL_INTERVAL_MS))
  }
  throw new Error(
    lastError
      ? `Session error: ${lastError.message}`
      : 'Timed out waiting for session after signup.'
  )
}

export async function verifyProfileExists(userId) {
  const deadline = Date.now() + PROFILE_VERIFY_MAX_WAIT_MS
  while (Date.now() < deadline) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, company_id, role')
      .eq('id', userId)
      .maybeSingle()
    if (data?.company_id) {
      log('profile_verified', { userId, company_id: data.company_id })
      return data
    }
    if (error) {
      log('profile_verify_error', { userId, error: error.message })
    }
    await new Promise((resolve) => setTimeout(resolve, PROFILE_VERIFY_INTERVAL_MS))
  }
  log('profile_verify_timeout', { userId })
  return null
}

export async function verifyMemberExists(userId, companyId) {
  if (!userId || !companyId) return null
  const { data, error } = await supabase
    .from('company_members')
    .select('id, company_id, user_id, role, status')
    .eq('user_id', userId)
    .eq('company_id', companyId)
    .maybeSingle()
  if (error) {
    log('member_verify_error', { userId, companyId, error: error.message })
    return null
  }
  if (data) {
    log('member_verified', { userId, companyId, memberId: data.id })
  }
  return data
}

async function reconcileProfileViaRpc(companyId, role, email) {
  try {
    const { data, error } = await supabase.rpc('reconcile_profile', {
      p_company_id: companyId,
      p_role: role || 'viewer',
      p_email: email || ''
    })
    if (error) throw error
    const row = Array.isArray(data) ? data?.[0] : data
    if (row?.company_id) {
      log('reconcile_profile_rpc_ok', { companyId: row.company_id })
      return row
    }
  } catch (e) {
    log('reconcile_profile_rpc_failed', { error: e.message })
  }
  return null
}

async function reconcileProfileDirect(userId, companyId, email, role) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .upsert(
        {
          id: userId,
          company_id: companyId,
          email: email || '',
          role: role || 'viewer',
          is_active: true
        },
        { onConflict: 'id' }
      )
      .select('id, company_id, role')
      .maybeSingle()
    if (error) throw error
    if (data?.company_id) {
      log('reconcile_profile_direct_ok', { companyId: data.company_id })
      return data
    }
  } catch (e) {
    log('reconcile_profile_direct_failed', { error: e.message })
  }
  return null
}

async function reconcileMemberViaRpc(companyId, role, email, invitedBy) {
  try {
    const { data, error } = await supabase.rpc('reconcile_member', {
      p_company_id: companyId,
      p_role: role || 'viewer',
      p_email: email || '',
      p_invited_by: invitedBy || null
    })
    if (error) throw error
    const row = Array.isArray(data) ? data?.[0] : data
    if (row?.id) {
      log('reconcile_member_rpc_ok', { memberId: row.id })
      return row
    }
  } catch (e) {
    log('reconcile_member_rpc_failed', { error: e.message })
  }
  return null
}

async function reconcileMemberDirect(userId, companyId, email, role, invitedBy) {
  try {
    const { data, error } = await supabase
      .from('company_members')
      .upsert(
        {
          company_id: companyId,
          user_id: userId,
          email: email || '',
          role: role || 'viewer',
          status: 'active',
          invited_by: invitedBy || null,
          joined_at: new Date().toISOString()
        },
        { onConflict: 'company_id,user_id' }
      )
      .select('id, company_id, user_id, role, status')
      .maybeSingle()
    if (error) throw error
    if (data?.id) {
      log('reconcile_member_direct_ok', { memberId: data.id })
      return data
    }
  } catch (e) {
    log('reconcile_member_direct_failed', { error: e.message })
  }
  return null
}

export async function reconcileProfile(userId, companyId, email, role) {
  if (!userId || !companyId) return null
  log('reconcile_profile_start', { userId, companyId, role })
  let result = await reconcileProfileViaRpc(companyId, role, email)
  if (!result) {
    result = await reconcileProfileDirect(userId, companyId, email, role)
  }
  if (result) {
    log('reconcile_profile_success', { userId, companyId })
  } else {
    log('reconcile_profile_failure', { userId, companyId })
  }
  return result
}

export async function reconcileMember(userId, companyId, email, role, invitedBy) {
  if (!userId || !companyId) return null
  log('reconcile_member_start', { userId, companyId, role })
  let result = await reconcileMemberViaRpc(companyId, role, email, invitedBy)
  if (!result) {
    result = await reconcileMemberDirect(userId, companyId, email, role, invitedBy)
  }
  if (result) {
    log('reconcile_member_success', { userId, companyId })
  } else {
    log('reconcile_member_failure', { userId, companyId })
  }
  return result
}

export async function joinWorkspaceFromInvite({ invite, authUser, token }) {
  const inviteToken = String(token || invite?.token || '').trim()
  const invitedEmail = normalizeEmail(invite?.email)

  if (!inviteToken) throw new Error('Invalid invite link.')
  if (!invitedEmail) throw new Error('Invite email missing.')
  if (!authUser?.id) throw new Error('Not authenticated')

  const sessionEmail = normalizeEmail(authUser?.email)
  if (sessionEmail && sessionEmail !== invitedEmail) {
    throw new Error('This invitation belongs to a different email address.')
  }

  if (isInviteExpired(invite?.expires_at)) {
    throw new Error('This invitation link has expired.')
  }
  if (invite?.status && invite.status !== 'pending') {
    throw new Error('This invitation is not valid anymore.')
  }

  log('rpc_call_start', { token: inviteToken })
  let rpcResult
  try {
    const { data, error } = await supabase.rpc('accept_invite', {
      p_token: inviteToken
    })
    if (error) throw error
    rpcResult = data
    log('rpc_call_ok', { data: rpcResult })
  } catch (e) {
    const msg = e?.message || e?.error || 'Failed to accept invitation.'
    log('rpc_call_failed', { error: msg })
    if (msg.toLowerCase().includes('does not exist')) {
      throw new Error('Invitation system is unavailable. Please contact support.')
    }
    throw new Error(msg)
  }

  const row = Array.isArray(rpcResult) ? rpcResult[0] : rpcResult
  if (!row) {
    log('rpc_empty_result', {})
    throw new Error('Failed to accept invitation. Please try again.')
  }

  const targetCompanyId = row.company_id || invite.company_id
  const targetRole = row.role || invite.role || 'viewer'
  const targetEmail = row.email || invitedEmail

  const profile = await verifyProfileExists(authUser.id)
  const member = profile ? await verifyMemberExists(authUser.id, targetCompanyId) : null

  if (!profile) {
    log('profile_missing_after_rpc', { userId: authUser.id })
    await reconcileProfile(authUser.id, targetCompanyId, targetEmail, targetRole)
  }

  if (!member) {
    log('member_missing_after_rpc', { userId: authUser.id, companyId: targetCompanyId })
    await reconcileMember(
      authUser.id,
      targetCompanyId,
      targetEmail,
      targetRole,
      invite.created_by || null
    )
  }

  const finalProfile = await verifyProfileExists(authUser.id)
  if (!finalProfile) {
    throw new Error('Your workspace is being set up. Please wait a moment and refresh.')
  }

  log('join_complete', {
    userId: authUser.id,
    companyId: targetCompanyId,
    profileExists: !!finalProfile,
    memberReconciled: !member
  })

  return {
    id: finalProfile.id || authUser.id,
    email: targetEmail,
    role: targetRole,
    company_id: targetCompanyId,
    alreadyAccepted: row.action_taken === 'already_accepted'
  }
}
