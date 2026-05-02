import { useEffect, useState, useRef } from 'react'
import { useDispatch } from 'react-redux'
import { supabase } from '../lib/supabaseClient'
import { setUser, setProfile, setLoading, clearUser } from '../store/slices/authSlice'
import { clearTenant } from '../store/slices/tenantSlice'
import { clearProjects } from '../store/slices/projectsSlice'
import { fetchProfile } from '../services/profileService'
import FullScreenLoader from '../components/common/FullScreenLoader'

/**
 * AuthProvider - Simplified authentication
 * - Does NOT force logout on missing profile
 * - Profile handling moved to onAuthStateChange
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
     * - ONLY checks session
     * - Sets user if session exists
     * - ALWAYS sets loading=false to prevent stuck UI
     * - Does NOT fetch profile here
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
          dispatch(setLoading(false))
          setIsInitialized(true)
          return
        }

        // Session exists - set user only
        console.log('[AuthProvider] Session found for:', session.user.id)
        dispatch(setUser(session.user))
        dispatch(setLoading(false))
        setIsInitialized(true)

        console.log('[AuthProvider] Init complete - user set, loading false')

      } catch (error) {
        console.log('[AuthProvider] Init error:', error.message)
        // On any error, still complete loading to prevent stuck
        dispatch(clearUser())
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
     * onAuthStateChange - HANDLE ALL profile logic here
     * - SIGNED_IN: setUser, fetchProfile, retry once
     * - SIGNED_OUT: clear all state
     * - NO forced logout on missing profile
     */
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return

        console.log('[AuthProvider] Auth event:', event)

        // SIGNED_OUT - clear everything
        if (event === 'SIGNED_OUT') {
          console.log('[AuthProvider] Signed out - clearing all state')
          dispatch(clearUser())
          dispatch(clearTenant())
          dispatch(clearProjects())
          return
        }

        // SIGNED_IN - handle profile with retry logic
        if (event === 'SIGNED_IN' && session && session.user) {
          console.log('[AuthProvider] SIGNED_IN for:', session.user.id)

          // Always set user first
          dispatch(setUser(session.user))

          // Fetch profile
          let profile = await fetchProfile(session.user.id).catch(() => null)
          console.log('[AuthProvider] Profile fetch result:', profile ? 'found' : 'null')

          // Retry once after 500ms if profile missing
          if (!profile) {
            console.log('[AuthProvider] Profile missing, retrying in 500ms...')
            await new Promise(res => setTimeout(res, 500))
            profile = await fetchProfile(session.user.id).catch(() => null)
            console.log('[AuthProvider] Retry profile result:', profile ? 'found' : 'null')
          }

          // If profile exists, set it
          // If still missing, just keep user (DO NOT logout)
          if (profile) {
            console.log('[AuthProvider] Setting profile:', profile.id)
            dispatch(setProfile(profile))
          } else {
            console.log('[AuthProvider] Profile still missing - keeping user logged in')
          }
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
