import { useState, useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { supabase } from '../../../lib/supabaseClient'
import { fetchUserProfile } from '../../../store/slices/profileSlice'
import { joinWorkspaceFromInvite, waitForAuthenticatedSession } from '../services/invitationService'
import {
  normalizeEmail,
  validatePasswordStrength,
  getInviteAvailabilityError,
  isAlreadyRegisteredError
} from '../utils/inviteValidation'

const log = (event, data) => {
  console.log(`[InviteFlow] ${event}`, data || '')
}

function validateInviteAvailable(invite) {
  const availabilityError = getInviteAvailabilityError(invite)
  if (availabilityError) {
    throw new Error(availabilityError)
  }
}

export function useAcceptInvitation({ invite, token, onSuccess, onAlreadyRegistered }) {
  const dispatch = useDispatch()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const clearError = useCallback(() => {
    setError('')
  }, [])

  const handleAcceptExistingSession = useCallback(
    async (authUser) => {
      if (submitting) return
      if (!invite?.id) {
        setError('Invalid invite link.')
        return
      }
      if (!authUser?.id) {
        setError('Not authenticated.')
        return
      }

      setError('')
      setSubmitting(true)

      try {
        log('accept_existing_session_start', { userId: authUser.id, inviteId: invite.id })
        validateInviteAvailable(invite)

        const result = await joinWorkspaceFromInvite({ invite, authUser, token })
        log('accept_existing_session_join_done', { userId: authUser.id })

        await supabase.auth.refreshSession()
        log('session_refreshed', { userId: authUser.id })

        if (authUser.id) {
          await dispatch(fetchUserProfile(authUser.id))
          log('profile_fetched', { userId: authUser.id })
        }

        if (onSuccess) {
          log('redirect_to_dashboard', { userId: authUser.id })
          await onSuccess()
        }
      } catch (e) {
        const msg = e?.message || 'Failed to accept invitation.'
        log('accept_existing_session_error', { error: msg })
        setError(msg)
      } finally {
        setSubmitting(false)
      }
    },
    [submitting, invite, token, onSuccess, dispatch]
  )

  const handleAccept = useCallback(
    async (password, confirmPassword, sessionUser) => {
      if (submitting) return

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
        log('accept_new_user_start', { inviteId: invite.id })

        const invitedEmail = normalizeEmail(invite?.email)
        if (!invitedEmail) throw new Error('Invite email missing.')

        const availabilityError = getInviteAvailabilityError(invite)
        if (availabilityError) {
          throw new Error(availabilityError)
        }

        const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
          email: invitedEmail,
          password,
          options: {
            data: { skip_provisioning: true, invited: true }
          }
        })

        if (signUpErr) {
          if (isAlreadyRegisteredError(signUpErr?.message)) {
            log('user_already_registered', { email: invitedEmail })
            if (onAlreadyRegistered) {
              onAlreadyRegistered(invitedEmail, token)
            }
            return
          }
          throw new Error(signUpErr.message || 'Failed to create account.')
        }

        log('signup_complete', { email: invitedEmail, userId: signUpData?.user?.id })

        let authUser = signUpData?.session?.user || null
        const emailConfirmedAt = signUpData?.user?.email_confirmed_at
        const requiresEmailConfirmation = !emailConfirmedAt

        if (requiresEmailConfirmation && !authUser?.id) {
          await supabase.auth.signOut()
          throw new Error(
            'Please confirm your email address before signing in. Check your inbox for a confirmation link.'
          )
        }

        const sessionResult = await waitForAuthenticatedSession()
        authUser = sessionResult.authUser
        log('session_acquired', { userId: authUser.id })

        if (!authUser?.id) {
          throw new Error('Authenticated user missing after account creation.')
        }

        await joinWorkspaceFromInvite({ invite, authUser, token })
        log('join_workspace_ok', { userId: authUser.id })

        await supabase.auth.refreshSession()
        log('session_refreshed', { userId: authUser.id })

        if (authUser.id) {
          await dispatch(fetchUserProfile(authUser.id))
          log('profile_fetched', { userId: authUser.id })
        }

        if (onSuccess) {
          log('redirect_to_dashboard', { userId: authUser.id })
          await onSuccess()
        }
      } catch (e) {
        const msg = e?.message || 'Failed to accept invitation.'
        log('accept_new_user_error', { error: msg })
        setError(msg)
      } finally {
        setSubmitting(false)
      }
    },
    [submitting, invite, token, onSuccess, onAlreadyRegistered, dispatch]
  )

  return {
    submitting,
    error,
    handleAccept,
    handleAcceptExistingSession,
    clearError
  }
}
