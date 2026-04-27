# Fix Role-Based Permission Bugs

## Root Cause
- `usePermission` reads `profile` from `state.profile`, but `AuthContext` dispatches profile to `state.auth` via `setUserProfile`.
- `useTenantAuth` (which populates `state.profile`) is never invoked in the app, so `state.profile.profile` is always `null`.
- Result: `role` is always `null` → `isAllowed = false` → buttons disabled for everyone, including admins.
- Tooltip falls through to `"Authentication required"` because `!role` is true.

## Tasks

- [x] 1. Read and analyze all relevant files
- [x] 2. Create TODO plan
- [x] 3. Fix `src/hooks/usePermission.js`
  - Read role from both `state.profile` and `state.auth`
  - Use combined loading state so UI waits for profile
  - Keep existing hook API unchanged
- [x] 4. Fix `src/utils/permissions.js`
  - Make `getPermissionTooltip` return role-based messages:
    - "Admin only"
    - "Admin or Manager only"
  - Handle undefined/null role safely in helpers
- [x] 5. Verify `src/components/auth/PermissionButton.jsx` needs no changes
- [x] 6. Run build/lint to verify

