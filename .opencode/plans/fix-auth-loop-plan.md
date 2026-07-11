# Fix Infinite Auth/Profile Loading Loop

## 1. `src/providers/AuthProvider.jsx` — Stop infinite retry reset

**Add** after line 51: `const profileRecoveryFailedRef = useRef(false)`

**Replace** lines 53-89 with:

```js
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
```

**Key changes**: `profileRecoveryFailedRef` guard at top. Exhaustion branch (lines 76-80 in original) no longer resets counter to 0 and dispatches — instead sets `profileRecoveryFailedRef = true` and stops.

---

## 2. `src/routes/PrivateRoute.jsx` — Decouple recovery from profile state

**Add** after line 26:
```js
const recoveryAttemptedRef = useRef(false)
const profileLoadedRef = useRef(false)
const [recoveryError, setRecoveryError] = useState(null)
```

**Insert** after line 32 (before the recovery effect):
```js
useEffect(() => {
  if (profile?.company_id) {
    profileLoadedRef.current = true
  }
}, [profile?.company_id])
```

**Replace** lines 34-106 with:
```js
useEffect(() => {
    if (!user?.id) return
    if (profileLoadedRef.current) return
    if (recoveryAttemptedRef.current) return
    if (reconcilingRef.current) return

    recoveryAttemptedRef.current = true

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
          } else {
            setRecoveryError('Profile recovery failed after 3 attempts')
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
          } else {
            setRecoveryError('Profile recovery failed after 3 attempts')
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
        } else {
          setRecoveryError('Profile recovery failed after 3 attempts')
        }
      } catch (e) {
        log('reconciliation_error', { userId: user.id, error: e.message })
        if (retryCountRef.current < 3) {
          timerRef.current = setTimeout(loadProfile, 2000)
        } else {
          setRecoveryError('Profile recovery failed after 3 attempts')
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
  }, [user?.id])
```

**Replace** lines 156-186 with error handling:
```js
  if (!initialized) {
    return <FullScreenLoader message="Initializing workspace..." />
  }

  if (!user || !user.id) {
    return <Navigate to="/signin" replace />
  }

  if (profileLoading) {
    return <FullScreenLoader message="Loading your workspace..." />
  }

  if (recoveryError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="card p-6 text-center max-w-md">
          <p className="text-red-500 text-sm mb-2">Failed to load workspace</p>
          <p className="text-gray-500 dark:text-gray-400 text-xs mb-4">{recoveryError}</p>
          <button onClick={() => window.location.reload()} className="btn btn-primary text-sm">
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!profile?.company_id && !profileLoading) {
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
```

**Key changes**: Effect deps changed from `[user?.id, hasProfile, profileLoading, dispatch, location, loadProfile]` to just `[user?.id]`. `recoveryAttemptedRef` prevents re-execution. Retries are bounded (3 max). Error boundary shown on failure instead of infinite loading.

---

## 3. `src/hooks/useTenantAuth.js` — Decouple fetch from profile state

**Add** after line 12: `const profileFetchAttemptedRef = useRef(false)`

**Replace** lines 14-19 with:
```js
  useEffect(() => {
    if (!isAuthenticated || !user) return
    if (profileFetchAttemptedRef.current) return

    profileFetchAttemptedRef.current = true
    dispatch(fetchUserProfile(user.id))
  }, [isAuthenticated, user, dispatch])
```

**Key changes**: Removed `profile` from deps. Added `profileFetchAttemptedRef` guard to prevent re-fetching on re-renders. Effect only depends on auth state, which is stable after initial load.
