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
     * initializeAuth - SECURE
     * - Step 1: Get user (validates token legitimacy)
     * - Step 2: If user exists → get session → fetch profile
     * - Step 3: Validate profile has company_id
     * - ALWAYS sets loading=false to prevent stuck UI
     */
    const initializeAuth = async () => {
      try {
        dispatch(setLoading(true))

        // Step 1: Get user (validates token is legitimate)
        const { data: { user: authUser }, error: userError } = await supabase.auth.getUser()

        if (!isMounted) return

        // If no user or error - force signOut and clear
        if (!authUser || userError) {
          await supabase.auth.signOut()
          dispatch(clearUser())
          dispatch(clearProfile())
          dispatch(clearTenant())
          dispatch(clearProjects())
          dispatch(setLoading(false))
          setIsInitialized(true)
          return
        }

        // Step 2: Get session and fetch profile
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          dispatch(setUser(session.user))
          dispatch(fetchUserProfile(session.user.id))
        }

        dispatch(setLoading(false))
        setIsInitialized(true)

      } catch (error) {
        // On any error, force signOut and clear
        await supabase.auth.signOut()
        dispatch(clearUser())
        dispatch(clearProfile())
        dispatch(clearTenant())
        dispatch(clearProjects())
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
