import { Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import FullScreenLoader from '../components/common/FullScreenLoader'

/**
 * RootRedirect - STRICT routing
 * - Shows loader while loading
 * - Redirects to /dashboard ONLY if authenticated with valid profile
 * - Redirects to /signin if NOT authenticated
 * 
 * Profile now comes from profileSlice (single source of truth)
 */
export default function RootRedirect() {
  const { user, loading } = useSelector((state) => state.auth)
  const { profile, isLoading: profileLoading } = useSelector((state) => state.profile)

  // Show loader while checking auth
  if (loading || profileLoading) {
    return <FullScreenLoader />
  }

  // STRICT CHECK: Must have user AND valid profile with company_id
  if (user && user.id && profile && profile.company_id) {
    return <Navigate to="/dashboard" replace />
  }

  // Any invalid state - redirect to signin
  return <Navigate to="/signin" replace />
}
