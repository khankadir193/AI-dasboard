# TODO - Auth Refactoring

## Task: Fix login/signup stuck issue

### Steps:
- [x] 1. Fix profileService.js - Remove join (.select('*, companies(*)') → .select('*'))
- [x] 2. Fix AuthProvider.jsx - Simplify initializeAuth() and onAuthStateChange()
- [x] 3. Test the changes

## Status: COMPLETED
- Removed join from profileService.js
- Simplified AuthProvider initializeAuth() - only checks session, sets user, always sets loading=false
- Moved all profile logic to onAuthStateChange with retry
- No forced logout on missing profile
