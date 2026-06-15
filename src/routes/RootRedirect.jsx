import { Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import FullScreenLoader from '../components/common/FullScreenLoader'

export default function RootRedirect() {
  const { user, loading, initialized } = useSelector((state) => state.auth)
  const { profile, isLoading: profileLoading } = useSelector((state) => state.profile)

  if (!initialized || loading) {
    return <FullScreenLoader message="Loading..." />
  }

  if (user?.id && profileLoading) {
    return <FullScreenLoader message="Loading your profile..." />
  }

  if (user && user.id && profile && profile.company_id) {
    return <Navigate to="/dashboard" replace />
  }

  if (user && user.id && !profile?.company_id) {
    return <Navigate to="/dashboard" replace />
  }

  return <Navigate to="/signin" replace />
}
