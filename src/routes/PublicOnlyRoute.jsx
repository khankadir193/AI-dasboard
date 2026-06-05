import { Navigate, useLocation } from 'react-router-dom'
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
  const location = useLocation()

  if (loading) {
    return <FullScreenLoader />
  }

  if (user && user.id) {
    const redirect = new URLSearchParams(location.search).get('redirect')
    if (redirect && redirect.startsWith('/invite/')) {
      return <Navigate to={redirect} replace />
    }
    return <Navigate to="/dashboard" replace />
  }

  return children
}
