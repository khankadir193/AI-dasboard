import { useEffect, useMemo, useState, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../../lib/supabaseClient'
import { fetchInviteByToken } from '../../../services/invitesService'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import { normalizeEmail } from '../utils/inviteValidation'
import { useAcceptInvitation } from '../hooks/useAcceptInvitation'
import InviteDetails from '../components/InviteDetails'
import AcceptInviteForm from '../components/AcceptInviteForm'

export default function AcceptInvitePage() {
  const { token } = useParams()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState('')
  const [invite, setInvite] = useState(null)
  const [companyName, setCompanyName] = useState('')
  const [sessionUser, setSessionUser] = useState(null)

  const finishAndRedirect = useCallback(async () => {
    await supabase.auth.signOut()
    navigate('/signin', {
      replace: true,
      state: {
        message: 'Your account has been created successfully. Please log in to continue.'
      }
    })
  }, [navigate])

  const handleAlreadyRegistered = useCallback(
    (invitedEmail, inviteToken) => {
      const redirect = `/invite/${encodeURIComponent(inviteToken || '')}`
      navigate(`/signin?redirect=${encodeURIComponent(redirect)}`, {
        replace: true,
        state: {
          message: 'An account already exists for this email. Sign in to accept the invitation.',
          email: invitedEmail
        }
      })
    },
    [navigate]
  )

  const { submitting, error, handleAccept, handleAcceptExistingSession } = useAcceptInvitation({
    invite,
    token,
    onSuccess: finishAndRedirect,
    onAlreadyRegistered: handleAlreadyRegistered
  })

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
      setPageError('')
      try {
        const inviteToken = token ? String(token).trim() : ''
        if (!inviteToken) {
          if (!cancelled) setPageError('Invalid invite link.')
          return
        }

        const { data: sessionData } = await supabase.auth.getSession()
        if (!cancelled) setSessionUser(sessionData?.session?.user || null)

        const inv = await fetchInviteByToken(inviteToken)

        if (!inv) {
          if (!cancelled) setPageError('This invitation link is invalid or has expired.')
          return
        }

        if (cancelled) return

        setInvite(inv)
        setCompanyName(inv?.company_name || '')
      } catch (e) {
        if (!cancelled) setPageError(e?.message || 'Failed to load invitation.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [token])

  function handleJoinWorkspace() {
    if (sessionUser?.id && sessionEmailMatchesInvite) {
      handleAcceptExistingSession(sessionUser)
    }
  }

  function handleFormSubmit(password, confirmPassword) {
    handleAccept(password, confirmPassword, sessionUser)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">Loading invitation...</p>
        </div>
      </div>
    )
  }

  if (pageError || !invite) {
    const displayError = pageError || 'Invitation not found.'

    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <div className="space-y-3">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Invitation unavailable</h1>
            <p className="text-sm text-gray-600 dark:text-gray-300">{displayError}</p>
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
        <div className="space-y-5">
          <InviteDetails
            invite={invite}
            companyName={companyName}
            sessionUser={sessionUser}
            inviteRoleLabel={inviteRoleLabel}
            sessionEmailMatchesInvite={sessionEmailMatchesInvite}
          />

          <AcceptInviteForm
            sessionUser={sessionUser}
            sessionEmailMatchesInvite={sessionEmailMatchesInvite}
            error={error}
            submitting={submitting}
            onSubmit={handleFormSubmit}
            onJoinWorkspace={handleJoinWorkspace}
            onCancel={() => navigate('/signin', { replace: true })}
          />
        </div>
      </Card>
    </div>
  )
}
