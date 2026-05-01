# Bug Fix TODO

## Summary
Fix: "No company associated with your account" error appearing after refresh/sign-out/sign-in

## Files Modified
1. ✅ src/services/profileService.js - Enhanced error logging
2. ✅ src/services/projectsService.js - Improved error messages  
3. ✅ src/services/provisionService.js - Added ensureUserProvisioned function
4. ✅ src/providers/AuthProvider.jsx - Added profile verification on sign-in

## What the Fix Does

### 1. profileService.js
- Added detailed logging for debugging
- Logs when userId is null
- Logs profile fetch errors with code, message, details
- Logs when profile is not found

### 2. projectsService.js  
- Added console.error for debugging
- Improved error message: "User profile not found. Please sign up or contact support."
- Keeps "No company associated" only for when company_id is NULL

### 3. provisionService.js
- Added ensureUserProvisioned function
- Checks if profile exists with company_id
- Only creates company/profile if needed
- Prevents duplicate company creation

### 4. AuthProvider.jsx
- Added provisioningRef to prevent race conditions
- On initializeAuth: checks profile.company_id, calls ensureUserProvisioned if NULL
- On SIGNED_IN: checks profile.company_id, calls ensureUserProvisioned if NULL
- Uses guard: if (profile?.company_id) return;

## Testing
- [ ] Test: Sign up fresh - should work
- [ ] Test: Refresh page - should work
- [ ] Test: Sign out and sign in - should work
- [ ] Test: Create project - should work
- [ ] Test: Refresh after creating project - should work

## Notes
- The database trigger still handles initial signup
- Frontend provisionService handles edge cases
- No duplicate company creation possible
- Guard prevents race conditions
