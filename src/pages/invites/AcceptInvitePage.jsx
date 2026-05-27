import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'

const normalizeRole = (role) => String(role || '').toLowerCase().trim()

const INVITE_ROLES = new Set(['admin', 'manager', 'analyst', 'viewer'])
const normalizeInvitedRole = (role) => {
  const r = normalizeRole(role)
  return INVITE_ROLES.has(r) ? r : 'viewer'
}

const isInviteExpired = (expiresAt) => {
  if (!expiresAt) return false
  const d = new Date(expiresAt)
  return Number.isNaN(d.getTime()) ? false : d.getTime() < Date.now()
}

const getInviteAvailabilityError = (row) => {
  if (!row) return 'Invalid invite link.'
  if (isInviteExpired(row?.expires_at)) return 'This invitation link has expired.'
  if (row?.status === 'accepted') return 'This invitation has already been accepted.'
  if (row?.status !== 'pending') return 'This invitation is not valid anymore.'
  return ''
}

const SESSION_POLL_INTERVAL_MS = 300
const SESSION_MAX_WAIT_MS = 6000

/** Poll until an authenticated session with a user exists (required for RLS writes). */
async function waitForAuthenticatedSession() {
  const deadline = Date.now() + SESSION_MAX_WAIT_MS
  while (Date.now() < deadline) {
    const { data: sessionData, error } = await supabase.auth.getSession()
    const authUser = sessionData?.session?.user
    if (authUser?.id) {
      return { sessionData, authUser }
    }
    if (error) {
      console.warn('[AcceptInvite] getSession error:', error)
    }
    await new Promise((resolve) => setTimeout(resolve, SESSION_POLL_INTERVAL_MS))
  }
  return null
}

export default function AcceptInvitePage() {
  const { token } = useParams()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [invite, setInvite] = useState(null)
  const [companyName, setCompanyName] = useState('')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const inviteRoleLabel = useMemo(() => {
    const r = invite?.role
    if (!r) return ''
    return r.charAt(0).toUpperCase() + String(r).slice(1)
  }, [invite?.role])

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const inviteToken = token ? String(token) : ''
        if (!inviteToken) {
          if (!cancelled) setError('Invalid invite link.')
          return
        }

        const { data: inv, error: invErr } = await supabase
          .from('invites')
          .select('*')
          .eq('token', inviteToken)
          .maybeSingle()

        if (invErr) throw new Error(invErr.message || 'Failed to fetch invite.')
        const availabilityError = getInviteAvailabilityError(inv)
        if (availabilityError) {
          if (!cancelled) setError(availabilityError)
          return
        }

        if (cancelled) return
        setInvite(inv)

        const { data: company, error: companyErr } = await supabase
          .from('companies')
          .select('name')
          .eq('id', inv?.company_id)
          .maybeSingle()

        if (companyErr) throw new Error(companyErr.message || 'Failed to fetch company.')
        setCompanyName(company?.name || '')
      } catch (e) {
        if (!cancelled) setError(e?.message || 'Failed to load invitation.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [token])

  const handleAccept = async (e) => {
    e?.preventDefault?.()
    if (submitting) return

    setError('')

    if (!invite?.id) {
      setError('Invalid invite link.')
      return
    }

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    try {
      setSubmitting(true)

      const invitedEmail = invite?.email
      if (!invitedEmail) throw new Error('Invite email missing.')
      if (!invite?.company_id) throw new Error('Invite company missing.')

      const role = normalizeInvitedRole(invite?.role || 'viewer')

      // Re-validate invite is still pending before any writes
      const { data: freshInvite, error: freshErr } = await supabase
        .from('invites')
        .select('id, status, expires_at')
        .eq('id', invite.id)
        .maybeSingle()

      if (freshErr) throw new Error(freshErr.message || 'Failed to validate invitation.')
      const availabilityError = getInviteAvailabilityError(freshInvite)
      if (availabilityError) {
        throw new Error(availabilityError)
      }

      // 1) Create auth user ONLY (no company/workspace creation).
      // skip_provisioning tells the handle_new_user() DB trigger to skip
      // auto-creating a company+profile so we can write the correct
      // invited company_id ourselves in the steps below.
      const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
        email: invitedEmail,
        password,
        options: {
          data: { skip_provisioning: 'true', invited: true }
        }
      })

      if (signUpErr) {
        throw new Error(signUpErr.message || 'Failed to create account.')
      }

      // 2) Wait until authenticated session exists (auth.uid() must match insert user_id)
      let sessionData
      let authUser

      if (signUpData?.session?.user?.id) {
        sessionData = { session: signUpData.session }
        authUser = signUpData.session.user
      } else {
        const sessionResult = await waitForAuthenticatedSession()
        if (!sessionResult) {
          throw new Error(
            'Authentication session was not ready in time. If email confirmation is enabled, confirm your email, then sign in and ask your admin to resend the invite.'
          )
        }
        sessionData = sessionResult.sessionData
        authUser = sessionResult.authUser
      }

      if (!authUser?.id) {
        throw new Error('Authenticated user missing after account creation.')
      }

      const payload = {
        company_id: invite.company_id,
        user_id: authUser.id,
        email: invitedEmail,
        role,
        status: 'active',
        invited_by: invite?.created_by || invite?.invited_by || null
      }

      console.log('SESSION:', sessionData)
      console.log('AUTH USER:', authUser)
      console.log('AUTH UID:', authUser?.id)
      console.log('PAYLOAD USER ID:', payload.user_id)
      console.log('COMPANY ID:', invite.company_id)

      // 3) Insert company_members first (RLS: auth.uid() = user_id)
      // Duplicate-safe: if row already exists, skip insert.
      const { data: existingMembership, error: existingMembershipErr } = await supabase
        .from('company_members')
        .select('company_id, user_id')
        .eq('company_id', payload.company_id)
        .eq('user_id', payload.user_id)
        .maybeSingle()

      if (existingMembershipErr) {
        throw new Error(existingMembershipErr.message || 'Failed to validate existing membership.')
      }

      let memberErr = null
      if (!existingMembership) {
        const memberInsertResult = await supabase.from('company_members').insert(payload)
        memberErr = memberInsertResult.error
      }

      if (memberErr) {
        console.error('[AcceptInvite] company_members insert failed:', memberErr)
        console.error('[AcceptInvite] session user id:', authUser?.id)
        console.error('[AcceptInvite] payload user_id:', payload.user_id)
        if (memberErr.code !== '23505') {
          const hint =
            authUser?.id !== payload.user_id
              ? ' Session user id does not match payload user_id (auth.uid mismatch).'
              : ''
          throw new Error((memberErr.message || 'Failed to add member to company.') + hint)
        }
        console.warn('[AcceptInvite] Membership already exists, continuing.')
      }

      // 4) Upsert profile to join EXISTING company (no new company)
      const { error: profileUpsertErr } = await supabase.from('profiles').upsert({
        id: authUser.id,
        company_id: invite.company_id,
        role
      })

      if (profileUpsertErr) {
        console.error('[AcceptInvite] profiles upsert failed:', profileUpsertErr)
        throw new Error(profileUpsertErr.message || 'Failed to attach user to the invited company.')
      }

      // 5) Mark invite accepted ONLY after membership + profile succeed
      const nowIso = new Date().toISOString()
      const { data: updatedInvite, error: updateErr } = await supabase
        .from('invites')
        .update({
          status: 'accepted',
          accepted_at: nowIso,
          accepted_by: authUser.id
        })
        .eq('id', invite.id)
        .eq('status', 'pending')
        .select('id')
        .maybeSingle()

      if (updateErr) throw new Error(updateErr.message || 'Failed to accept invitation.')
      if (!updatedInvite?.id) {
        throw new Error('This invitation is no longer available (already accepted or invalid).')
      }

      // 6) Clear temporary signup session; user signs in cleanly afterward
      await supabase.auth.signOut()

      navigate('/signin', {
        replace: true,
        state: { message: 'Invitation accepted successfully. Please sign in.' }
      })
    } catch (e) {
      setError(e?.message || 'Failed to accept invitation.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-gray-500 dark:text-gray-400 text-sm">Loading invitation...</div>
      </div>
    )
  }

  if (error) {
    const normalized = String(error || '').toLowerCase()
    const isPermissionDenied = normalized.includes('permission') || normalized.includes('rls')
    const isAuthIssue = normalized.includes('not authenticated') || normalized.includes('authentication') || normalized.includes('jwt')

    const title = isPermissionDenied
      ? 'You do not have access to this workspace'
      : isAuthIssue
        ? 'Sign in required'
        : 'Invitation unavailable'

    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <div className="space-y-3">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h1>
            <p className="text-sm text-gray-600 dark:text-gray-300">{error}</p>
            <Button
              variant="secondary"
              onClick={() => navigate(isAuthIssue ? '/signin' : '/signin', { replace: true })}
              className="mt-2"
              disabled={submitting}
            >
              Go to Sign In
            </Button>
          </div>
        </Card>
      </div>
    )
  }


  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <form onSubmit={handleAccept} className="space-y-5">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Accept Invitation</h1>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              You&apos;ve been invited to join <span className="font-medium">{companyName || 'your workspace'}</span>
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Invited email</label>
              <div className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2">
                {invite?.email}
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Role</label>
              <div className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2">
                {inviteRoleLabel || 'Viewer'}
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-900 dark:text-white">Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password"
              disabled={submitting}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-900 dark:text-white">Confirm Password</label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
              disabled={submitting}
              error={undefined}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              disabled={submitting}
              onClick={() => navigate('/signin', { replace: true })}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={submitting}
              disabled={submitting}
              className="w-full sm:w-auto"
            >
              Accept Invitation
            </Button>
          </div>

          {submitting && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Creating your account and joining the workspace...
            </p>
          )}
        </form>
      </Card>
    </div>
  )
}

