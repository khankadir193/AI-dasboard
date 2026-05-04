import { Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import FullScreenLoader from '../components/common/FullScreenLoader'

/**
 * PublicOnlyRoute - STRICT protection
 * - Shows loader while loading
 * - Redirects to /dashboard if authenticated
 * - Allows signin/signup if not authenticated
 */
export default function PublicOnlyRoute({ children }) {
  const { user, loading } = useSelector((state) => state.auth)

  if (loading) {
    return <FullScreenLoader />
  }

  // 🚨 If user exists, redirect to dashboard
  if (user && user.id) {
    console.log('[PublicOnlyRoute] User exists - redirecting to dashboard')
    return <Navigate to="/dashboard" replace />
  }

  return children
}
