import { useEffect, useState, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { supabase } from '../lib/supabaseClient'
import { setUser, setLoading, clearUser } from '../store/slices/authSlice'
import { clearProfile, fetchUserProfile } from '../store/slices/profileSlice'
import { clearTenant } from '../store/slices/tenantSlice'
import { clearProjects } from '../store/slices/projectsSlice'
import FullScreenLoader from '../components/common/FullScreenLoader'
import { trackEvent } from '../features/analytics/trackEvent'

/**
 * AuthProvider - Simplified authentication
 * - Auth: only handles user + loading state
 * - Profile: use async thunk from profileSlice
 * - Always ensures loading completes to prevent UI stuck
 */
export default function AuthProvider({ children }) {
  const dispatch = useDispatch()
  const [isInitialized, setIsInitialized] = useState(false)
  const timeoutRef = useRef(null)
  const { user } = useSelector((state) => state.auth)
  const { profile } = useSelector((state) => state.profile)
  const loginTrackedRef = useRef(false)

  useEffect(() => {
    let isMounted = true

    /**
     * initializeAuth - SIMPLIFIED
     * - Get session
     * - If session exists → setUser AND fetchUserProfile (via async thunk)
     * - ALWAYS sets loading=false to prevent stuck UI
     */
    const initializeAuth = async () => {
      try {
        dispatch(setLoading(true))

        // Get session only
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (!isMounted) return

        // If no session or error - clear and finish
        if (!session || sessionError) {
          dispatch(clearUser())
          dispatch(clearProfile())
          dispatch(setLoading(false))
          setIsInitialized(true)
          return
        }

        // Session exists - set user
        dispatch(setUser(session.user))

        // Fetch profile via async thunk
        dispatch(fetchUserProfile(session.user.id))

        dispatch(setLoading(false))
        setIsInitialized(true)

      } catch (error) {
        // On any error, still complete loading to prevent stuck
        dispatch(clearUser())
        dispatch(clearProfile())
        dispatch(setLoading(false))
        setIsInitialized(true)
      }
    }

    // Start initialization
    initializeAuth()

    // Timeout fallback - ensures we never get stuck
    timeoutRef.current = setTimeout(() => {
      if (!isInitialized) {
        dispatch(setLoading(false))
        setIsInitialized(true)
      }
    }, 5000)

    /**
     * onAuthStateChange - Handle auth events
     * - SIGNED_IN: setUser + fetchUserProfile (async thunk)
     * - SIGNED_OUT: clear all state
     */
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return

        // SIGNED_OUT - clear everything
        if (event === 'SIGNED_OUT') {
          loginTrackedRef.current = false
          dispatch(clearUser())
          dispatch(clearProfile())
          dispatch(clearTenant())
          dispatch(clearProjects())
          return
        }

        // SIGNED_IN - set user and dispatch profile fetch
        if (event === 'SIGNED_IN' && session && session.user) {
          // Always set user first
          dispatch(setUser(session.user))

          // Fetch profile via async thunk
          dispatch(fetchUserProfile(session.user.id))
        }
      }
    )

    return () => {
      isMounted = false
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      subscription.unsubscribe()
    }
  }, [dispatch])

  // Track login analytics when user and profile are available
  useEffect(() => {
    // company must exist
    if (!profile?.company_id) {
      return
    }

    // already tracked for this login session
    if (loginTrackedRef.current) {
      return
    }

    // lock immediately
    loginTrackedRef.current = true

    trackEvent({
      companyId: profile.company_id,
      type: 'active_users',
      value: 1
    })
  }, [profile?.company_id])

  if (!isInitialized) {
    return <FullScreenLoader />
  }

  return children
}
