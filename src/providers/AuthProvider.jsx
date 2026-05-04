import { useEffect, useState, useRef } from 'react'
import { useDispatch } from 'react-redux'
import { supabase } from '../lib/supabaseClient'
import { setUser, setLoading, clearUser } from '../store/slices/authSlice'
import { clearProfile, fetchUserProfile } from '../store/slices/profileSlice'
import { clearTenant } from '../store/slices/tenantSlice'
import { clearProjects } from '../store/slices/projectsSlice'
import FullScreenLoader from '../components/common/FullScreenLoader'

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
        console.log('[AuthProvider] Checking for existing session...')

        // Get session only
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (!isMounted) return

        // If no session or error - clear and finish
        if (!session || sessionError) {
          console.log('[AuthProvider] No valid session, setting loading complete')
          dispatch(clearUser())
          dispatch(clearProfile())
          dispatch(setLoading(false))
          setIsInitialized(true)
          return
        }

        // Session exists - set user
        console.log('[AuthProvider] Session found for:', session.user.id)
        dispatch(setUser(session.user))

        // Fetch profile via async thunk
        console.log('[AuthProvider] Fetching profile via thunk...')
        dispatch(fetchUserProfile(session.user.id))

        dispatch(setLoading(false))
        setIsInitialized(true)

        console.log('[AuthProvider] Init complete - user set, loading false, profile fetching')

      } catch (error) {
        console.log('[AuthProvider] Init error:', error.message)
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
        console.log('[AuthProvider] Timeout - forcing load complete')
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

        console.log('[AuthProvider] Auth event:', event)

        // SIGNED_OUT - clear everything
        if (event === 'SIGNED_OUT') {
          console.log('[AuthProvider] Signed out - clearing all state')
          dispatch(clearUser())
          dispatch(clearProfile())
          dispatch(clearTenant())
          dispatch(clearProjects())
          return
        }

        // SIGNED_IN - set user and dispatch profile fetch
        if (event === 'SIGNED_IN' && session && session.user) {
          console.log('[AuthProvider] SIGNED_IN for:', session.user.id)

          // Always set user first
          dispatch(setUser(session.user))

          // Fetch profile via async thunk
          console.log('[AuthProvider] Dispatching fetchUserProfile thunk...')
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

  if (!isInitialized) {
    return <FullScreenLoader />
  }

  return children
}
