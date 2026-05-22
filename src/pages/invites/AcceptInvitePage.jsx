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
        if (!inv) {
          if (!cancelled) setError('Invalid invite link.')
          return
        }

        // Validate invite status
        const status = inv?.status
        if (status !== 'pending') {
          if (!cancelled) {
            setError(status === 'accepted' ? 'This invitation has already been accepted.' : 'This invitation is not valid anymore.')
          }
          return
        }

        // Validate expiry
        if (isInviteExpired(inv?.expires_at)) {
          if (!cancelled) setError('This invitation link has expired.')
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

      // 1) Create auth user ONLY (no company/workspace creation here)
      const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
        email: invitedEmail,
        password
      })

      if (signUpErr) {
        throw new Error(signUpErr.message || 'Failed to create account.')
      }

      // Supabase returns user in data.user
      const userId = signUpData?.user?.id
      if (!userId) throw new Error('User id missing after account creation.')

      // Ensure an authenticated session exists before writing RLS-protected tables.
      // Depending on Supabase auth settings (email confirmation, etc.) session may not be immediate.
      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData?.session?.access_token
      if (!accessToken) {
        throw new Error(
          'Authentication not ready yet. If email confirmation is enabled, confirm your email or sign in again, then try accepting the invite.'
        )
      }


      // 2) Prevent duplicate invitation usage + set accepted fields atomically (best-effort)
      const nowIso = new Date().toISOString()
      const { data: updatedInvite, error: updateErr } = await supabase
        .from('invites')
        .update({
          status: 'accepted',
          accepted_at: nowIso,
          accepted_by: userId,
          company_id: invite.company_id,
          role: role
        })
        .eq('id', invite.id)
        .eq('status', 'pending')
        .select('id')
        .maybeSingle()

      if (updateErr) throw new Error(updateErr.message || 'Failed to accept invitation.')
      if (!updatedInvite?.id) {
        throw new Error('This invitation is no longer available (already accepted or invalid).')
      }

      // 3) Ensure profile points to the EXISTING company and invited role
      // This prevents any trigger/default logic from leaving the user attached to a newly created company.
      const { error: profileUpsertErr } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          company_id: invite.company_id,
          role
        })

      if (profileUpsertErr) {
        throw new Error(profileUpsertErr.message || 'Failed to attach user to the invited company.')
      }

      // 4) Insert membership record into existing company_members (NO workspace_members)
      const { error: memberErr } = await supabase
        .from('company_members')
        .insert({
          company_id: invite.company_id,
          user_id: userId,
          email: invitedEmail,
          role,
          status: 'active',
          invited_by: invite?.created_by || invite?.invited_by || null
        })

      if (memberErr) throw new Error(memberErr.message || 'Failed to add member to company.')


      navigate('/dashboard', { replace: true })
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

