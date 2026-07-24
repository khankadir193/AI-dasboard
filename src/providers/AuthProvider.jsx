import { useEffect, useState, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'
import { setUser, setLoading, setInitialized, clearUser } from '../store/slices/authSlice'
import { clearProfile, fetchUserProfile } from '../store/slices/profileSlice'
import { clearTenant } from '../store/slices/tenantSlice'
import { clearProjects } from '../store/slices/projectsSlice'
import FullScreenLoader from '../components/common/FullScreenLoader'
import { ensureFeatureFlags } from '../services/featureFlagService'

const AUTH_REQUEST_TIMEOUT_MS = 8000
const PROFILE_RETRY_DELAY_MS = 1500
const MAX_PROFILE_RETRIES = 10

const withTimeout = (promise, label) => {
  let timeoutId
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`${label} timed out`))
    }, AUTH_REQUEST_TIMEOUT_MS)
  })

  return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId))
}

export default function AuthProvider({ children }) {
  const dispatch = useDispatch()
  const queryClient = useQueryClient()
  const [isInitialized, setIsInitialized] = useState(false)

  const didInit = useRef(false)

  const userInStore = useSelector((state) => state.auth.user)
  const profileInStore = useSelector((state) => state.profile.profile)

  const latestProfileIdRef = useRef(profileInStore?.company_id)
  useEffect(() => {
    latestProfileIdRef.current = profileInStore?.company_id
  }, [profileInStore?.company_id])

  const currentUserIdRef = useRef(userInStore?.id ?? null)
  const lastFetchedIdRef = useRef(null)
  const profileRetryCountRef = useRef(0)
  const profileRetryTimerRef = useRef(null)

  useEffect(() => {
    currentUserIdRef.current = userInStore?.id ?? null
  }, [userInStore?.id])

  const profileRecoveryFailedRef = useRef(false)

  const attemptProfileFetch = (userId) => {
    profileRetryCountRef.current = 0
    lastFetchedIdRef.current = userId
    profileRecoveryFailedRef.current = false
    dispatch(fetchUserProfile(userId))
  }

  const handleAuthWithProfile = (session) => {
    const incomingUserId = session?.user?.id ?? null
    if (!incomingUserId) return

    if (profileRecoveryFailedRef.current) return

    if (incomingUserId === currentUserIdRef.current) {
      if (incomingUserId !== lastFetchedIdRef.current) {
        attemptProfileFetch(incomingUserId)
      } else if (!latestProfileIdRef.current) {
        if (profileRetryCountRef.current < MAX_PROFILE_RETRIES) {
          profileRetryCountRef.current += 1
          if (profileRetryTimerRef.current) {
            clearTimeout(profileRetryTimerRef.current)
          }
          profileRetryTimerRef.current = setTimeout(() => {
            lastFetchedIdRef.current = incomingUserId
            dispatch(fetchUserProfile(incomingUserId))
          }, PROFILE_RETRY_DELAY_MS)
        } else if (!profileRecoveryFailedRef.current) {
          profileRecoveryFailedRef.current = true
          lastFetchedIdRef.current = incomingUserId
        }
      }
      return
    }

    currentUserIdRef.current = incomingUserId
    dispatch(setUser(session.user))

    attemptProfileFetch(incomingUserId)
  }

  const clearSessionState = async ({ signOut = false } = {}) => {
    if (profileRetryTimerRef.current) {
      clearTimeout(profileRetryTimerRef.current)
      profileRetryTimerRef.current = null
    }
    profileRetryCountRef.current = 0
    if (signOut) {
      try {
        await withTimeout(supabase.auth.signOut(), 'signOut')
      } catch (e) {
      }
    }
    dispatch(clearUser())
    dispatch(clearProfile())
    dispatch(clearTenant())
    dispatch(clearProjects())
    queryClient.clear()
  }

  useEffect(() => {
    let isMounted = true
    let didDispatchLoadingFalse = false

    const initializeAuth = async () => {
      dispatch(setLoading(true))

      try {
        const { data: { user: authUser }, error: userError } = await withTimeout(
          supabase.auth.getUser(),
          'getUser'
        )

        if (!authUser || userError) {
          await clearSessionState({ signOut: true })
          return
        }

        const { data: { session } } = await withTimeout(
          supabase.auth.getSession(),
          'getSession'
        )
        if (session?.user) {
          handleAuthWithProfile(session)
        }
      } catch (e) {
        await clearSessionState({ signOut: true })
      } finally {
        if (!didDispatchLoadingFalse) {
          didDispatchLoadingFalse = true
          dispatch(setLoading(false))
        }
        dispatch(setInitialized(true))
        setIsInitialized(true)
      }
    }

    if (!didInit.current) {
      didInit.current = true
      void initializeAuth()
    }

    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return

        if (event === 'SIGNED_OUT') {
          const cid = latestProfileIdRef.current
          const uid = currentUserIdRef.current
          currentUserIdRef.current = null
          lastFetchedIdRef.current = null
          profileRetryCountRef.current = 0
          if (profileRetryTimerRef.current) {
            clearTimeout(profileRetryTimerRef.current)
            profileRetryTimerRef.current = null
          }
          if (cid) {
            // Logout is a session/auth event, not a business action.
            // It is deliberately NOT logged to activity_logs per product spec.
            // If security audit logging is required, add a separate security_audit_log table.
          }
          void clearSessionState()
          return
        }

        if (event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') {
          handleAuthWithProfile(session)
        }
        if (event === 'SIGNED_IN') {
          handleAuthWithProfile(session)
        }
      }
    )

    return () => {
      isMounted = false
      if (profileRetryTimerRef.current) {
        clearTimeout(profileRetryTimerRef.current)
        profileRetryTimerRef.current = null
      }
      try {
        if (typeof authSubscription?.unsubscribe === 'function') {
          authSubscription.unsubscribe()
        }
      } catch (e) {
      }
    }
  }, [])

  useEffect(() => {
    if (!profileInStore?.company_id) return
    ensureFeatureFlags(profileInStore.company_id)
      .catch(err => console.error('[AuthProvider] ensureFeatureFlags error:', err))
  }, [profileInStore?.company_id])

  if (!isInitialized) {
    return <FullScreenLoader message="Initializing..." />
  }

  return children
}
