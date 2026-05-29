import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { supabase } from '../lib/supabaseClient'
import { fetchMyMembership } from '../services/usersService'
import FullScreenLoader from '../components/common/FullScreenLoader'

const SUSPENDED_MESSAGE = 'Your workspace access has been suspended.'

export default function PrivateRoute({ children }) {
  const { user, loading } = useSelector((state) => state.auth)
  const { profile, isLoading: profileLoading } = useSelector((state) => state.profile)
  const [membershipChecked, setMembershipChecked] = useState(false)
  const [accessBlocked, setAccessBlocked] = useState(false)

  useEffect(() => {
    let cancelled = false

    const verifyMembership = async () => {
      if (!user?.id || !profile?.company_id) {
        if (!cancelled) {
          setMembershipChecked(true)
          setAccessBlocked(false)
        }
        return
      }

      try {
        const membership = await fetchMyMembership(user.id, profile.company_id)
        if (cancelled) return

        if (membership && membership.status !== 'active') {
          await supabase.auth.signOut()
          setAccessBlocked(true)
        } else {
          setAccessBlocked(false)
        }
      } catch {
        if (!cancelled) setAccessBlocked(false)
      } finally {
        if (!cancelled) setMembershipChecked(true)
      }
    }

    if (!loading && !profileLoading && user?.id && profile?.company_id) {
      setMembershipChecked(false)
      verifyMembership()
    } else if (!loading && !profileLoading) {
      setMembershipChecked(true)
      setAccessBlocked(false)
    }

    return () => {
      cancelled = true
    }
  }, [user?.id, profile?.company_id, loading, profileLoading])

  if (loading || profileLoading || (user?.id && profile?.company_id && !membershipChecked)) {
    return <FullScreenLoader />
  }

  if (!user || !user.id || !profile || !profile.company_id) {
    return <Navigate to="/signin" replace />
  }

  if (accessBlocked) {
    return (
      <Navigate
        to="/signin"
        replace
        state={{ message: SUSPENDED_MESSAGE }}
      />
    )
  }

  return children
}
