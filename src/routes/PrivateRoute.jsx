import { Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import FullScreenLoader from '../components/common/FullScreenLoader'

export default function PrivateRoute({ children }) {
  const { user, loading } = useSelector((state) => state.auth)

  if (loading) {
    return <FullScreenLoader />
  }

  console.log('[PrivateRoute] User:', {user,loading})

  // ✅ ONLY check user
  if (!user || !user.id) {
    console.log('[PrivateRoute] BLOCK - No user, redirecting to signin')
    return <Navigate to="/signin" replace />
  }

  return children
}