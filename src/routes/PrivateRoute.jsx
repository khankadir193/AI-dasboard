import { useEffect, useState, useRef, useCallback } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { supabase } from '../lib/supabaseClient'
import { fetchMyMembership } from '../services/usersService'
import { fetchUserProfile } from '../store/slices/profileSlice'
import FullScreenLoader from '../components/common/FullScreenLoader'
import { reconcileProfile, reconcileMember, verifyProfileExists, verifyMemberExists } from '../features/invitations/services/invitationService'

const log = (event, data) => {
  console.log(`[PrivateRoute] ${event}`, data || '')
}

export default function PrivateRoute({ children }) {
  const dispatch = useDispatch()
  const location = useLocation()
  const { user, loading, initialized } = useSelector((state) => state.auth)
  const { profile, isLoading: profileLoading } = useSelector((state) => state.profile)

  const [membershipChecked, setMembershipChecked] = useState(false)
  const [accessBlocked, setAccessBlocked] = useState(false)

  const hasProfile = Boolean(profile?.company_id)
  const reconcilingRef = useRef(false)
  const retryCountRef = useRef(0)
  const timerRef = useRef(null)

  const loadProfile = useCallback(() => {
    if (!user?.id) return
    retryCountRef.current += 1
    dispatch(fetchUserProfile(user.id))
  }, [dispatch, user?.id])

  useEffect(() => {
    if (!user?.id) return
    if (hasProfile) return
    if (profileLoading) return

    const attemptReconciliation = async () => {
      if (reconcilingRef.current) return
      reconcilingRef.current = true

      try {
        const profileData = await verifyProfileExists(user.id)
        if (profileData?.company_id) {
          log('recovered_profile_via_api', { userId: user.id })
          dispatch(fetchUserProfile(user.id))
          return
        }

        const inviteToken = extractInviteToken(location)
        if (!inviteToken) {
          if (retryCountRef.current < 3) {
            timerRef.current = setTimeout(loadProfile, 2000)
          }
          return
        }

        const { data: invite } = await supabase.rpc('get_invite_for_accept', {
          p_token: inviteToken
        })
        const row = Array.isArray(invite) ? invite?.[0] : invite
        if (!row?.company_id) {
          if (retryCountRef.current < 3) {
            timerRef.current = setTimeout(loadProfile, 2000)
          }
          return
        }

        log('reconciling_from_invite', { userId: user.id, companyId: row.company_id })
        const reconciledProfile = await reconcileProfile(
          user.id, row.company_id, row.email, row.role
        )
        if (row.company_id) {
          await reconcileMember(
            user.id, row.company_id, row.email, row.role, row.created_by || null
          )
        }
        if (reconciledProfile?.company_id) {
          log('reconciliation_success', { userId: user.id })
          dispatch(fetchUserProfile(user.id))
          return
        }

        if (retryCountRef.current < 3) {
          timerRef.current = setTimeout(loadProfile, 2000)
        }
      } catch (e) {
        log('reconciliation_error', { userId: user.id, error: e.message })
        if (retryCountRef.current < 3) {
          timerRef.current = setTimeout(loadProfile, 2000)
        }
      } finally {
        reconcilingRef.current = false
      }
    }

    attemptReconciliation()

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [user?.id, hasProfile, profileLoading, dispatch, location, loadProfile])

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    const verifyMembership = async () => {
      if (!user?.id || !profile?.company_id) {
        if (!cancelled) {
          setMembershipChecked(true)
          setAccessBlocked(false)
        }
        return
      }

      try {
        const membership = await fetchMyMembership(user.id, profile.company_id)
        if (cancelled) return

        if (membership && membership.status !== 'active') {
          await supabase.auth.signOut()
          setAccessBlocked(true)
        } else {
          setAccessBlocked(false)
        }
      } catch (err) {
        if (!cancelled) setAccessBlocked(true)
      } finally {
        if (!cancelled) setMembershipChecked(true)
      }
    }

    if (initialized && !loading && !profileLoading && user?.id && profile?.company_id) {
      setMembershipChecked(false)
      verifyMembership()
    }

    return () => {
      cancelled = true
    }
  }, [initialized, loading, profileLoading, user?.id, profile?.company_id])

  if (!initialized) {
    return <FullScreenLoader message="Initializing workspace..." />
  }

  if (!user || !user.id) {
    return <Navigate to="/signin" replace />
  }

  if (profileLoading) {
    return <FullScreenLoader message="Loading your workspace..." />
  }

  if (!hasProfile) {
    return <FullScreenLoader message="Setting up your workspace..." />
  }

  if (!membershipChecked) {
    return <FullScreenLoader message="Verifying access..." />
  }

  if (accessBlocked) {
    return (
      <Navigate
        to="/signin"
        replace
        state={{ message: 'Your workspace access has been suspended.' }}
      />
    )
  }

  return children
}

function extractInviteToken(location) {
  const match = location.pathname?.match?.(/\/invite\/([^/]+)/)
  if (match?.[1]) return decodeURIComponent(match[1])
  try {
    const params = new URLSearchParams(location.search)
    const t = params.get('token') || params.get('inviteToken') || params.get('t')
    if (t) return t
  } catch {}
  return null
}
