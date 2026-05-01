import { Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import FullScreenLoader from '../components/common/FullScreenLoader'

/**
 * RootRedirect - STRICT routing
 * - Shows loader while loading
 * - Redirects to /dashboard ONLY if authenticated with valid profile
 * - Redirects to /signin if NOT authenticated
 */
export default function RootRedirect() {
  const { user, profile, loading } = useSelector((state) => state.auth)

  // Show loader while checking auth
  if (loading) {
    return <FullScreenLoader />
  }

  // ---------------------------------------------------------
  // STRICT CHECK: Must have user AND valid profile with company_id
  // NEVER trust stale Redux state
  // ---------------------------------------------------------
  if (user && user.id && profile && profile.company_id) {
    console.log('[RootRedirect] Valid user + profile - redirecting to dashboard')
    return <Navigate to="/dashboard" replace />
  }

  // Any invalid state - redirect to signin
  console.log('[RootRedirect] No valid user/profile - redirecting to signin')
  return <Navigate to="/signin" replace />
}
