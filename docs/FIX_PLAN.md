# Authentication Fix Plan - STRICT Implementation

## Problem Statement
- After logout, refreshing the app redirects to /dashboard instead of /signin
- Session persists in browser and is not properly invalidated
- Dashboard can open without valid backend user + profile

## Root Causes
1. AuthProvider uses `getSession()` instead of `getUser()` 
2. No forced signOut() when clearing stale sessions
3. RootRedirect only checks Redux user, not profile validity
4. Auto-provisioning allows users without company_id to access dashboard

## Files to Edit

### 1. src/providers/AuthProvider.jsx (MAIN FIX)

#### Changes Required:

**Import Updates:**
```javascript
import { clearProjects } from '../store/slices/projectsSlice'
// Already have: clearUser, clearProfile, clearTenant
```

**New initializeAuth flow:**
1. HARD RESET - Call `supabase.auth.getUser()` FIRST
2. If user is NULL → force signOut() → dispatch all clears → STOP
3. If user exists → getSession() → fetch profile
4. If profile is NULL or company_id is NULL → signOut() → clear ALL → STOP
5. Only set user + profile if both exist AND company_id exists

**Key Implementation:**
- Use `supabase.auth.getUser()` (verifies token is legitimate)
- Use `supabase.auth.signOut()` when clearing invalid sessions
- Use `isResetting` flag to prevent infinite loops

### 2. src/routes/RootRedirect.jsx (ADDITIONAL)

**Changes Required:**
- Import profile from Redux
- Check: user && user.id AND profile && profile.company_id

## Implementation Details

### AuthProvider.jsx New Structure:

```javascript
// BEFORE: Just getSession()
// NEW: Two-step verification

// Step 1: Get user (validates token)
const { data: { user: authUser }, error: userError } = await supabase.auth.getUser()

if (!authUser || userError) {
  // FORCE LOGOUT
  await supabase.auth.signOut()
  dispatch(clearUser())
  dispatch(clearProfile())
  dispatch(clearTenant())
  dispatch(clearProjects())
  return // STOP
}

// Step 2: Get session + profile
const { data: { session } } = await supabase.auth.getSession()
const profile = await fetchProfile(session.user.id)

// Validate profile
if (!profile?.company_id) {
  await supabase.auth.signOut()
  dispatch(clearUser())
  dispatch(clearProfile())
  dispatch(clearTenant())
  dispatch(clearProjects())
  return // STOP
}

// Step 3: All valid - set state
dispatch(setUser(session.user))
dispatch(setProfile(profile))
```

### RootRedirect.jsx New Check:

```javascript
// OLD: if (user && user.id)
// NEW: if (user && user.id && profile && profile.company_id)
```

## Expected Final Behavior

| Scenario | Expected |
|----------|----------|
| Open app (no login) | /signin |
| After logout + refresh | /signin (NOT /dashboard) |
| Deleted user | /signin |
| Invalid session | Auto cleared → /signin |
| Valid user + profile + company_id | /dashboard |

## Testing Checklist

- [ ] Open app without login → redirects to /signin
- [ ] Login → redirects to /dashboard
- [ ] Logout → refresh page → stays at /signin
- [ ] Manually delete session cookie → refresh → /signin
- [ ] Try to access /dashboard directly without auth → /signin

## Files Modified
1. src/providers/AuthProvider.jsx
2. src/routes/RootRedirect.jsx

## No Changes To
- UI components
- Routing structure
- Package dependencies
