# Audit/Hotfix TODO — Auth, Routing, Invite Flow

- [ ] 1) Add `auth.initialized` to `src/store/slices/authSlice.js` and wire reducer actions.
- [ ] 2) Refactor `src/providers/AuthProvider.jsx`:
  - [ ] ensure bootstrap runs once
  - [ ] ensure `setLoading(false)` fires exactly once after bootstrap
  - [ ] add required diagnostics logs
  - [ ] fix auth listener cleanup / dedupe
  - [ ] prevent duplicate profile fetches via in-flight ref
- [ ] 3) Gate redirects on `auth.initialized`:
  - [ ] `src/routes/PublicOnlyRoute.jsx`
  - [ ] `src/routes/PrivateRoute.jsx`
  - [ ] `src/routes/RootRedirect.jsx`
- [ ] 4) Add temporary diagnostics to route guards (current route, redirect target, reason, auth/user/profile ids).
- [ ] 5) Harden `src/components/ErrorBoundary.jsx` optional chaining (errorInfo access).
- [ ] 6) Add minimal diagnostics to invite flow pages/hooks to confirm no auth-bootstrap reruns.
- [ ] 7) Run `npm run build` (and lint/tests if available).
- [ ] 8) Manual verification matrix:
  - [ ] fresh load signed out
  - [ ] sign in
  - [ ] sign out
  - [ ] accept invite signed out
  - [ ] accept invite signed in

