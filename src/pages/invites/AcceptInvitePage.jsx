import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { fetchInviteByToken } from '../../services/invitesService'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'

const normalizeRole = (role) => String(role || '').toLowerCase().trim()
const normalizeEmail = (email) => String(email || '').trim().toLowerCase()

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

const isAlreadyRegisteredError = (message) => {
  const normalized = String(message || '').toLowerCase()
  return normalized.includes('already registered') || normalized.includes('user already exists')
}

const validatePasswordStrength = (password) => {
  if (!password || password.length < 6) {
    return 'Password must be at least 6 characters'
  }
  const hasUpperCase = /[A-Z]/.test(password)
  const hasLowerCase = /[a-z]/.test(password)
  const hasNumber = /\d/.test(password)
  if (!hasUpperCase || !hasLowerCase || !hasNumber) {
    return 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
  }
  return ''
}

async function joinWorkspaceFromInvite({ invite, authUser }) {
  const invitedEmail = normalizeEmail(invite?.email)
  if (!invitedEmail) throw new Error('Invite email missing.')
  if (!invite?.company_id) throw new Error('Invite company missing.')

  console.log('[AcceptInvite] joinWorkspaceFromInvite start', {
    inviteId: invite.id,
    companyId: invite.company_id,
    invitedEmail,
    userId: authUser.id
  })

  const role = normalizeInvitedRole(invite?.role || 'viewer')

  const payload = {
    company_id: invite.company_id,
    user_id: authUser.id,
    email: invitedEmail,
    role,
    status: 'active',
    invited_by: invite?.created_by || invite?.invited_by || null
  }

  console.log('[AcceptInvite] company_members insert payload', payload)

  const { data: existingMembership, error: existingMembershipErr } = await supabase
    .from('company_members')
    .select('company_id, user_id')
    .eq('company_id', payload.company_id)
    .eq('user_id', payload.user_id)
    .maybeSingle()

  console.log('[AcceptInvite] Check existing membership', {
    error: existingMembershipErr?.message || existingMembershipErr?.code,
    exists: !!existingMembership
  })

  if (existingMembershipErr) {
    throw new Error(existingMembershipErr.message || 'Failed to validate existing membership.')
  }

  if (!existingMembership) {
    const { error: memberErr } = await supabase.from('company_members').insert(payload)
    console.log('[AcceptInvite] company_members insert result', {
      error: memberErr?.message || memberErr?.code
    })
    if (memberErr && memberErr.code !== '23505') {
      throw new Error(memberErr.message || 'Failed to add member to company.')
    }
  }

  const { error: profileUpsertErr } = await supabase.from('profiles').upsert({
    id: authUser.id,
    company_id: invite.company_id,
    role,
    email: invitedEmail
  })

  console.log('[AcceptInvite] profiles upsert result', {
    error: profileUpsertErr?.message || profileUpsertErr?.code
  })

  if (profileUpsertErr) {
    throw new Error(profileUpsertErr.message || 'Failed to attach user to the invited company.')
  }

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

  console.log('[AcceptInvite] invites update result', {
    error: updateErr?.message || updateErr?.code,
    updated: !!updatedInvite
  })

  if (updateErr) throw new Error(updateErr.message || 'Failed to accept invitation.')
  if (!updatedInvite?.id) {
    throw new Error('This invitation is no longer available (already accepted or invalid).')
  }

  console.log('[AcceptInvite] joinWorkspaceFromInvite completed successfully')
}

export default function AcceptInvitePage() {
  const { token } = useParams()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [invite, setInvite] = useState(null)
  const [companyName, setCompanyName] = useState('')
  const [sessionUser, setSessionUser] = useState(null)

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const inviteRoleLabel = useMemo(() => {
    const r = invite?.role
    if (!r) return ''
    return r.charAt(0).toUpperCase() + String(r).slice(1)
  }, [invite?.role])

  const sessionEmailMatchesInvite = useMemo(() => {
    if (!sessionUser?.email || !invite?.email) return false
    return normalizeEmail(sessionUser.email) === normalizeEmail(invite.email)
  }, [sessionUser?.email, invite?.email])

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const inviteToken = token ? String(token).trim() : ''
        if (!inviteToken) {
          if (!cancelled) setError('Invalid invite link.')
          return
        }

        const { data: sessionData } = await supabase.auth.getSession()
        if (!cancelled) setSessionUser(sessionData?.session?.user || null)
        console.log('[AcceptInvite] Current session user', { userId: sessionData?.session?.user?.id, email: sessionData?.session?.user?.email })
        const inv = await fetchInviteByToken(inviteToken)

        console.log('[AcceptInvite] fetchInviteByToken result', {
          found: !!inv,
          inviteId: inv?.id,
          status: inv?.status,
          email: inv?.email,
          companyId: inv?.company_id,
          expiresAt: inv?.expires_at
        })

        const availabilityError = getInviteAvailabilityError(inv)

        if (availabilityError) {
          // Debug-safe: keep message user-friendly but log more detail for diagnosis
          if (!cancelled) {
            setError(availabilityError)
          }
          console.warn('[AcceptInvite] invite availability error', {
            token: inviteToken,
            availabilityError,
            inviteRow: inv
          })
          return
        }

        if (cancelled) return

        setInvite(inv)

        setCompanyName(inv?.company_name || '')
        console.log('[AcceptInvite] Invite loaded successfully', { inviteId: inv?.id, companyName: inv?.company_name })

      } catch (e) {
        console.error('[AcceptInvite] Error loading invitation', {
          error: e?.message,
          errorCode: e?.code
        })
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



  const finishAndSignIn = async () => {
    await supabase.auth.signOut()
    navigate('/signin', {
      replace: true,
      state: { message: 'Invitation accepted successfully. Please sign in.' }
    })
  }

  const handleAcceptExistingSession = async () => {
    if (submitting || !invite?.id || !sessionUser?.id) return

    console.log('[AcceptInvite] handleAcceptExistingSession starting', {
      inviteId: invite.id,
      userId: sessionUser.id,
      sessionEmail: sessionUser.email,
      inviteEmail: invite.email
    })

    // If user is signed in with a different email, show a clear message.
    // Do NOT allow accepting with the wrong account.
    if (!sessionEmailMatchesInvite) {
      const errorMsg = 'You are signed in with a different email. Sign out and sign in with the invited email address to accept this invitation.'
      console.warn('[AcceptInvite] Email mismatch in handleAcceptExistingSession', {
        sessionEmail: sessionUser.email,
        inviteEmail: invite.email
      })
      setError(errorMsg)
      return
    }

    setError('')
    setSubmitting(true)
    try {
      await joinWorkspaceFromInvite({ invite, authUser: sessionUser })
      console.log('[AcceptInvite] handleAcceptExistingSession completed successfully')
      await finishAndSignIn()
    } catch (e) {
      console.error('[AcceptInvite] Error in handleAcceptExistingSession', {
        error: e?.message,
        errorCode: e?.code
      })
      setError(e?.message || 'Failed to accept invitation.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleAccept = async (e) => {
    e?.preventDefault?.()
    if (submitting) return

    if (sessionUser?.id && sessionEmailMatchesInvite) {
      return handleAcceptExistingSession()
    }

    setError('')

    if (!invite?.id) {
      setError('Invalid invite link.')
      return
    }

    const passwordError = validatePasswordStrength(password)
    if (passwordError) {
      setError(passwordError)
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    try {
      setSubmitting(true)
      console.log('[AcceptInvite] Starting acceptance flow', { inviteId: invite?.id, inviteToken: token })

      const invitedEmail = normalizeEmail(invite?.email)

      if (!invitedEmail) throw new Error('Invite email missing.')

      console.log('[AcceptInvite] Verified email from invite', { invitedEmail })

      // Pre-flight check: Verify invite availability using cached invite data
      // The invite was already loaded and verified on page load
      // We re-use that data here instead of re-querying (which would fail with RLS for unauthenticated users)
      console.log('[AcceptInvite] Pre-flight check using cached invite', {
        inviteId: invite.id,
        status: invite.status,
        expiresAt: invite.expires_at
      })
      const availabilityError = getInviteAvailabilityError(invite)
      if (availabilityError) {
        throw new Error(availabilityError)
      }
      console.log('[AcceptInvite] Pre-flight check passed')

      const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
        email: invitedEmail,
        password,
        options: {
          data: { skip_provisioning: true, invited: true }
        }
      })

      console.log('[AcceptInvite] Signup attempt', {
        signupError: signUpErr?.message || signUpErr?.code,
        signupUser: signUpData?.user?.id,
        signupSession: !!signUpData?.session,
        emailConfirmedAt: signUpData?.user?.email_confirmed_at
      })

      if (signUpErr) {
        if (isAlreadyRegisteredError(signUpErr?.message)) {
          console.log('[AcceptInvite] Account already registered, redirecting to signin')
          const redirect = `/invite/${encodeURIComponent(token || '')}`
          navigate(`/signin?redirect=${encodeURIComponent(redirect)}`, {
            replace: true,
            state: {
              message: 'An account already exists for this email. Sign in to accept the invitation.',
              email: invitedEmail
            }
          })
          return
        }
        console.error('[AcceptInvite] Signup error:', signUpErr)
        throw new Error(signUpErr.message || 'Failed to create account.')
      }

      let authUser = signUpData?.session?.user || null
      const newUserEmail = signUpData?.user?.email
      const emailConfirmedAt = signUpData?.user?.email_confirmed_at
      const requiresEmailConfirmation = !emailConfirmedAt

      console.log('[AcceptInvite] Account created, checking email confirmation', {
        newUserEmail,
        emailConfirmedAt,
        requiresEmailConfirmation,
        hasInitialSession: !!authUser?.id
      })

      // If email confirmation is required and no session, stop here
      if (requiresEmailConfirmation && !authUser?.id) {
        console.log('[AcceptInvite] Email confirmation required before proceeding')
        await supabase.auth.signOut()
        throw new Error('Please confirm your email address before signing in. Check your inbox for a confirmation link.')
      }

      const sessionResult = await waitForAuthenticatedSession()

      console.log('[AcceptInvite] Session polling result', {
        hasSession: !!sessionResult,
        authUserId: sessionResult?.authUser?.id || authUser?.id,
        waitedMs: SESSION_MAX_WAIT_MS
      })

      if (sessionResult) {
        authUser = sessionResult.authUser
      } else if (!authUser?.id) {
        throw new Error('Account created but session not established. Please sign in with your new credentials.')
      }

      if (!authUser?.id) {
        throw new Error('Authenticated user missing after account creation.')
      }
      console.log('[AcceptInvite] User authenticated', { userId: authUser.id, email: authUser.email })



      // Use the cached invite data that was already verified
      // joinWorkspaceFromInvite will perform final verification when updating invite status
      const completeInvite = { ...invite, id: invite.id }

      console.log('[AcceptInvite] Calling joinWorkspaceFromInvite with', {

        inviteId: completeInvite.id,

        companyId: completeInvite.company_id,

        role: completeInvite.role,

        userId: authUser.id

      })



      await joinWorkspaceFromInvite({ invite: completeInvite, authUser })
      console.log('[AcceptInvite] joinWorkspaceFromInvite succeeded')

      // CRITICAL: Test signin with new credentials before redirecting to signin page
      // This catches email confirmation or credential issues before user tries manual signin
      console.log('[AcceptInvite] Verifying account signin credentials')
      const testSignin = await supabase.auth.signInWithPassword({
        email: invitedEmail,
        password
      })

      if (testSignin?.error) {
        console.error('[AcceptInvite] Signin verification failed', {
          error: testSignin.error.message,
          code: testSignin.error.code
        })
        // Don't throw - let user know and allow manual signin attempt
        await supabase.auth.signOut()
        setError('Account created! ' + testSignin.error.message + ' Try signing in manually.')
        setSubmitting(false)
        return
      }

      console.log('[AcceptInvite] Signin verification passed, account is ready')
      await finishAndSignIn()
    } catch (e) {
      console.error('[AcceptInvite] Error during acceptance', {
        error: e?.message,
        errorCode: e?.code,
        errorDetails: e
      })
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



  if (error && !invite) {

    const normalized = String(error || '').toLowerCase()

    const isPermissionDenied = normalized.includes('permission') || normalized.includes('rls')

    const isAuthIssue =

      normalized.includes('not authenticated') ||

      normalized.includes('authentication') ||

      normalized.includes('jwt')



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

              onClick={() => navigate('/signin', { replace: true })}

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

              You&apos;ve been invited to join{' '}

              <span className="font-medium">{companyName || 'your workspace'}</span>

            </p>

          </div>



          {error && (

            <p className="text-sm text-red-600 dark:text-red-400" role="alert">

              {error}

            </p>

          )}



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



          {sessionUser?.id && sessionEmailMatchesInvite ? (

            <div className="rounded-lg border border-blue-200 bg-blue-50/60 p-4 dark:border-blue-800 dark:bg-blue-950/30">

              <p className="text-sm text-blue-900 dark:text-blue-100">

                You are signed in as <span className="font-medium">{sessionUser.email}</span>. Click below to

                join this workspace.

              </p>

              <Button

                type="button"

                variant="primary"

                loading={submitting}

                disabled={submitting}

                className="mt-3 w-full sm:w-auto"

                onClick={handleAcceptExistingSession}

              >

                Join Workspace

              </Button>

            </div>

          ) : sessionUser?.id ? (

            <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-800 dark:bg-amber-950/30">

              <p className="text-sm text-amber-900 dark:text-amber-100">

                You are signed in as {sessionUser.email}, but this invite was sent to {invite?.email}. Sign out

                or use the correct account.

              </p>

              <Button
                type="button"
                variant="secondary"
                className="mt-3"
                onClick={async () => {
                  await supabase.auth.signOut()
                  setSessionUser(null)
                }}
              >
                Sign out
              </Button>

            </div>

          ) : (
            <>
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
                />
              </div>
            </>
          )}

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

            {!sessionUser?.id && (
              <Button
                type="submit"
                variant="primary"
                loading={submitting}
                disabled={submitting}
                className="w-full sm:w-auto"
              >
                Accept Invitation
              </Button>
            )}
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


