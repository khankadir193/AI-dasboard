import { Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import FullScreenLoader from '../components/common/FullScreenLoader'

export default function PrivateRoute({ children }) {
  const { user, loading } = useSelector((state) => state.auth)
  const { profile, isLoading: profileLoading } = useSelector((state) => state.profile)

  // Show loader while checking auth
  if (loading || profileLoading) {
    return <FullScreenLoader />
  }

  // STRICT CHECK: Must have user AND valid profile with company_id
  if (!user || !user.id || !profile || !profile.company_id) {
    return <Navigate to="/signin" replace />
  }

  return children
}