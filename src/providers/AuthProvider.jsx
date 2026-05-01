import { useEffect, useState, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { supabase } from '../lib/supabaseClient'
import { setUser, setProfile, setLoading, clearUser } from '../store/slices/authSlice'
import { clearTenant } from '../store/slices/tenantSlice'
import { clearProjects } from '../store/slices/projectsSlice'
import { fetchProfile } from '../services/profileService'
import FullScreenLoader from '../components/common/FullScreenLoader'

/**
 * AuthProvider - STRICT authentication
 * ONLY trusts Supabase, NEVER trusts persisted state
 */
export default function AuthProvider({ children }) {
  const dispatch = useDispatch()
  const [isInitialized, setIsInitialized] = useState(false)
  const timeoutRef = useRef(null)
  const isResettingRef = useRef(false)

  useEffect(() => {
    let isMounted = true

    /**
     * STRICT: Hard reset on app load
     * - First verify user with getUser()
     * - Then validate session + profile
     * - Force signOut if invalid
     */
    const initializeAuth = async () => {
      // Prevent infinite loops
      if (isResettingRef.current) {
        console.log('[AuthProvider] Already resetting, skipping...')
        return
      }

      try {
        dispatch(setLoading(true))

        console.log('[AuthProvider] Starting STRICT auth check...')

        // ---------------------------------------------------------
        // STEP 1: HARD VALIDATE with getUser()
        // This verifies the JWT token is legitimate
        // ---------------------------------------------------------
        const { data: { user: authUser }, error: userError } = await supabase.auth.getUser()

        if (!isMounted) return

        // If NO USER or ERROR - FORCE LOGOUT
        if (!authUser || userError) {
          console.log('[AuthProvider] No valid user from getUser() - forcing logout')
          
          // Mark resetting to prevent loops
          isResettingRef.current = true
          
          // Force sign out to clear browser session
          await supabase.auth.signOut().catch(() => {})
          
          // Clear ALL state
          dispatch(clearUser())
          dispatch(clearTenant())
          dispatch(clearProjects())
          
          // Reset flag
          isResettingRef.current = false
          
          // STOP execution
          dispatch(setLoading(false))
          setIsInitialized(true)
          return
        }

        // ---------------------------------------------------------
        // STEP 2: Get session and validate profile
        // ---------------------------------------------------------
        console.log('[AuthProvider] User validated:', authUser.id, 'email:', authUser.email)

        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (!isMounted) return

        // If session error - logout
        if (sessionError) {
          console.log('[AuthProvider] Session error:', sessionError.message)
          isResettingRef.current = true
          await supabase.auth.signOut().catch(() => {})
          dispatch(clearUser())
          dispatch(clearTenant())
          dispatch(clearProjects())
          isResettingRef.current = false
          dispatch(setLoading(false))
          setIsInitialized(true)
          return
        }

        if (!session) {
          console.log('[AuthProvider] No session found')
          isResettingRef.current = true
          await supabase.auth.signOut().catch(() => {})
          dispatch(clearUser())
          dispatch(clearTenant())
          dispatch(clearProjects())
          isResettingRef.current = false
          dispatch(setLoading(false))
          setIsInitialized(true)
          return
        }

        // ---------------------------------------------------------
        // STEP 3: Fetch profile and validate company_id
        // ---------------------------------------------------------
        console.log('[AuthProvider] Fetching profile for:', session.user.id)
        console.log('[AuthProvider] Session user:', session.user.email)
        
        let profile = null
        
        try {
          profile = await fetchProfile(session.user.id)
          console.log('[AuthProvider] Profile fetched:', profile)
        } catch (pfError) {
          console.log('[AuthProvider] Profile fetch error:', pfError.message)
          profile = null
        }

        if (!isMounted) return

        // ---------------------------------------------------------
        // STRICT CHECK: Profile MUST exist with company_id
        // Retry once to handle DB trigger delays
        // ---------------------------------------------------------
        if (!profile || !profile.company_id) {
          console.log('[AuthProvider] Profile missing or invalid company_id. Profile:', profile)
          console.log('[AuthProvider] Retrying fetch after 500ms...')
          
          // Retry once after small delay
          await new Promise(res => setTimeout(res, 500))
          profile = await fetchProfile(session.user.id).catch(() => null)
          console.log('[AuthProvider] Retry profile result:', profile)
        }

        if (!profile || !profile.company_id) {
          console.log('[AuthProvider] Profile still missing → forcing logout')
          
          await supabase.auth.signOut().catch(() => {})
          dispatch(clearUser())
          dispatch(clearTenant())
          dispatch(clearProjects())
          dispatch(setLoading(false))
          setIsInitialized(true)
          return
        }

        // ---------------------------------------------------------
        // STEP 4: All valid - set user and profile
        // ---------------------------------------------------------
        console.log('[AuthProvider] All valid - setting user and profile')
        console.log('[AuthProvider] User to set:', session.user.id, session.user.email)
        console.log('[AuthProvider] Profile to set:', profile.id, profile.company_id)
        
        dispatch(setUser(session.user))
        dispatch(setProfile(profile))
        dispatch(setLoading(false))
        setIsInitialized(true)

        console.log('[AuthProvider] Auth complete - user:', session.user.id, 'company:', profile.company_id)

      } catch (error) {
        console.log('[AuthProvider] Auth error:', error.message)
        
        // On any error, force logout
        isResettingRef.current = true
        await supabase.auth.signOut().catch(() => {})
        
        dispatch(clearUser())
        dispatch(clearTenant())
        dispatch(clearProjects())
        
        isResettingRef.current = false
        
        if (isMounted) {
          dispatch(setLoading(false))
          setIsInitialized(true)
        }
      }
    }

    // Start auth initialization
    initializeAuth()

    // 5-second timeout fallback
    timeoutRef.current = setTimeout(() => {
      if (!isInitialized) {
        console.log('[AuthProvider] Timeout - forcing load complete')
        dispatch(setLoading(false))
        setIsInitialized(true)
      }
    }, 5000)

    /**
     * Listen for auth state changes
     * This handles browser tab events and Supabase events
     */
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return

        console.log('[AuthProvider] Auth event:', event)
        console.log('[AuthProvider] Session in event:', session ? 'exists' : 'null')
        if (session) {
          console.log('[AuthProvider] Session user:', session.user?.id, session.user?.email)
        }

        // SIGNED_OUT - clear everything
        if (event === 'SIGNED_OUT') {
          console.log('[AuthProvider] Signed out detected - clearing all state')
          dispatch(clearUser())
          dispatch(clearTenant())
          dispatch(clearProjects())
          return
        }

        console.log('session...kadir', session);
        // SIGNED_IN - validate and set state
        if (event === 'SIGNED_IN' && session && session.user) {
          console.log('[AuthProvider] SIGNED_IN detected for user:', session.user.id)
          let profile = await fetchProfile(session.user.id).catch(() => null)

          console.log('[AuthProvider] First profile fetch result:', profile)

          if (!profile || !profile.company_id) {
            console.log('[AuthProvider] Profile missing/invalid, retrying...')
            await new Promise(res => setTimeout(res, 500))
            profile = await fetchProfile(session.user.id).catch(() => null)
            console.log('[AuthProvider] Retry profile result:', profile)
          }

          if (!profile || !profile.company_id) {
            console.log('[AuthProvider] Invalid profile after SIGNED_IN')
            await supabase.auth.signOut().catch(() => {})
            dispatch(clearUser())
            return
          }

          console.log('[AuthProvider] Setting user and profile from SIGNED_IN')
          dispatch(setUser(session.user))
          dispatch(setProfile(profile))
          console.log('[AuthProvider] SIGNED_IN complete - user:', session.user.id, 'profile:', profile?.company_id)
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
