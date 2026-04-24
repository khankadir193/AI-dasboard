import { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { tenantApi } from '../lib/tenantApi'
import { fetchUserProfile } from '../store/slices/profileSlice'
import { fetchTenantDetails } from '../store/slices/tenantSlice'

export function useTenantAuth() {
  const dispatch = useDispatch()
  const { user, isAuthenticated } = useSelector((state) => state.auth)
  const { profile } = useSelector((state) => state.profile)
  const { currentTenant } = useSelector((state) => state.tenant)

  useEffect(() => {
    if (isAuthenticated && user && !profile) {
      // Fetch user profile when authenticated but profile not loaded
      dispatch(fetchUserProfile(user.id))
    }
  }, [isAuthenticated, user, profile, dispatch])

  useEffect(() => {
    if (profile && profile.tenant_id && !currentTenant) {
      // Fetch tenant details when profile is loaded but tenant not loaded
      dispatch(fetchTenantDetails(profile.tenant_id))
    }
  }, [profile, currentTenant, dispatch])

  useEffect(() => {
    // Set tenant ID in tenant API when available
    if (currentTenant?.id) {
      tenantApi.setTenantId(currentTenant.id)
    } else {
      tenantApi.clearTenant()
    }
  }, [currentTenant])

  return {
    isAuthenticated,
    user,
    profile,
    tenant: currentTenant,
    tenantApi,
    isLoading: !profile || !currentTenant
  }
}
