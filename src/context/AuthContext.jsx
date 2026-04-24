import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useDispatch } from 'react-redux'
import { supabase } from '../lib/supabaseClient'
import { setUserProfile } from '../store/slices/authSlice'

const AuthContext = createContext(null)
const AUTH_TIMEOUT_MS = 6000

export function AuthProvider({ children }) {
  const dispatch = useDispatch()
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const provisioningLocksRef = useRef(new Map())

  useEffect(() => {
    let mounted = true
    let initTimeoutId = null

    const withTimeout = async (promise, fallbackValue) => {
      try {
        const timeoutPromise = new Promise((resolve) => {
          setTimeout(() => resolve(fallbackValue), AUTH_TIMEOUT_MS)
        })
        return await Promise.race([promise, timeoutPromise])
      } catch (_error) {
        return fallbackValue
      }
    }

    const resolveValidSession = async (candidateSession) => {
      if (!candidateSession) return null

      const result = await withTimeout(supabase.auth.getUser(), {
        data: { user: null },
        error: new Error('Auth validation timeout'),
      })

      const { data, error } = result
      if (error || !data?.user) {
        return null
      }

      return candidateSession
    }

    const fetchProfile = async (userId) => {
      if (!userId) return null
      const { data, error } = await withTimeout(
        supabase.from('profiles').select("*, companies(*)").eq('id', userId).maybeSingle(),
        { data: null, error: new Error('Profile fetch timeout') }
      )
      if (error) return null
      if (data) {
        // Dispatch to Redux for global state management
        dispatch(setUserProfile(data))
      }
      return data
    }

    const ensureUserProvisioned = async (authUser) => {
      if (!authUser?.id) return null
      const existingLock = provisioningLocksRef.current.get(authUser.id)
      if (existingLock) return existingLock

      const runProvisioning = async () => {
        const existingProfile = await fetchProfile(authUser.id)
        if (existingProfile?.company_id) return existingProfile

        const fallbackCompanyName = `${authUser.email?.split('@')[0] || 'New'} Company`
        const companyName = authUser.user_metadata?.company_name?.trim() || fallbackCompanyName
        const metadataCompanyId = authUser.user_metadata?.company_id ?? null
        let companyId = null

        // Reuse company from metadata if we already created one in a previous attempt.
        if (metadataCompanyId) {
          const { data: existingCompany } = await withTimeout(
            supabase.from('companies').select('id').eq('id', metadataCompanyId).maybeSingle(),
            { data: null, error: new Error('Company lookup timeout') }
          )
          companyId = existingCompany?.id ?? null
        }

        if (!companyId) {
          const { data: company, error: companyError } = await withTimeout(
            supabase.from('companies').insert({ name: companyName }).select().single(),
            { data: null, error: new Error('Company provisioning timeout') }
          )

          if (companyError || !company?.id) {
            return existingProfile ?? null
          }

          companyId = company.id
        }

        // Persist company reference in auth metadata so retries won't create new companies.
        await withTimeout(
          supabase.auth.updateUser({
            data: {
              company_id: companyId,
              company_name: companyName,
            },
          }),
          { data: null, error: new Error('User metadata update timeout') }
        )

        // Use only guaranteed columns to avoid schema mismatch failures.
        let { error: profileError } = await withTimeout(
          supabase.from('profiles').upsert(
            {
              id: authUser.id,
              company_id: companyId,
              role: 'admin',
            },
            { onConflict: 'id' }
          ),
          { error: new Error('Profile provisioning timeout') }
        )

        // Fallback path: explicit insert if upsert is blocked by policy/onConflict issues.
        if (profileError) {
          const insertResult = await withTimeout(
            supabase.from('profiles').insert({
              id: authUser.id,
              company_id: companyId,
              role: 'admin',
            }),
            { error: new Error('Profile insert fallback timeout') }
          )
          profileError = insertResult?.error ?? null
        }

        if (profileError) {
          console.error('Profile provisioning failed:', profileError)
          return existingProfile ?? null
        }
        return fetchProfile(authUser.id)
      }

      const promise = runProvisioning().finally(() => {
        provisioningLocksRef.current.delete(authUser.id)
      })
      provisioningLocksRef.current.set(authUser.id, promise)
      return promise
    }

    const initializeSession = async () => {
      try {
        const result = await withTimeout(supabase.auth.getSession(), {
          data: { session: null },
          error: new Error('Auth initialization timeout'),
        })

        if (!mounted) return
        const { data, error } = result

        if (error) {
          setSession(null)
          setProfile(null)
        } else {
          const nextSession = await resolveValidSession(data.session ?? null)
          if (!mounted) return
          setSession(nextSession)
          if (nextSession?.user?.id) {
            const nextProfile = await ensureUserProvisioned(nextSession.user)
            if (!mounted) return
            setProfile(nextProfile)
          } else {
            setProfile(null)
          }
        }
      } catch (_error) {
        if (!mounted) return
        setSession(null)
        setProfile(null)
      } finally {
        if (!mounted) return
        setIsLoading(false)
      }
    }

    // Hard stop to prevent full-screen loader from hanging forever.
    initTimeoutId = setTimeout(() => {
      if (!mounted) return
      setSession(null)
      setIsLoading(false)
    }, AUTH_TIMEOUT_MS + 500)

    initializeSession()

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      const validatedSession = await resolveValidSession(nextSession ?? null)
      if (!mounted) return
      setSession(validatedSession)
      if (validatedSession?.user?.id) {
        const nextProfile = await ensureUserProvisioned(validatedSession.user)
        if (!mounted) return
        setProfile(nextProfile)
      } else {
        setProfile(null)
      }
      setIsLoading(false)
    })

    return () => {
      mounted = false
      if (initTimeoutId) clearTimeout(initTimeoutId)
      authListener.subscription.unsubscribe()
    }
  }, [])

  const signOut = useCallback(async () => {
    setIsSigningOut(true)
    try {
      await supabase.auth.signOut()
      setSession(null)
      setProfile(null)
    } finally {
      setIsSigningOut(false)
    }
  }, [])

  const user = session?.user ?? null
  const firstName = profile?.first_name ?? user?.user_metadata?.first_name ?? null
  const lastName = profile?.last_name ?? user?.user_metadata?.last_name ?? null
  const fullNameFromProfile = profile?.full_name ?? null
  const displayName =
    fullNameFromProfile ||
    [firstName, lastName].filter(Boolean).join(' ').trim() ||
    user?.email?.split('@')[0] ||
    'User'
  const initials = displayName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const value = useMemo(
    () => ({
      session,
      user,
      profile,
      displayName,
      initials,
      email: user?.email ?? '',
      isAuthenticated: Boolean(session),
      isLoading,
      isSigningOut,
      signOut,
    }),
    [session, user, profile, displayName, initials, isLoading, isSigningOut, signOut]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }
  return context
}
