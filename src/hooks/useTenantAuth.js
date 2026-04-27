import { useEffect, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { tenantApi } from '../lib/tenantApi'
import { fetchUserProfile } from '../store/slices/profileSlice'
import { fetchTenantDetails, clearTenant } from '../store/slices/tenantSlice'

export function useTenantAuth() {
  const dispatch = useDispatch()
  const { user, isAuthenticated } = useSelector((state) => state.auth)
  const { profile } = useSelector((state) => state.profile)
  const { currentTenant } = useSelector((state) => state.tenant)
  const lastCompanyIdRef = useRef(null)

  useEffect(() => {
    if (isAuthenticated && user && !profile) {
      // Fetch user profile when authenticated but profile not loaded
      dispatch(fetchUserProfile(user.id))
    }
  }, [isAuthenticated, user, profile, dispatch])

  useEffect(() => {
    const currentCompanyId = profile?.company_id ?? null
    const previousCompanyId = lastCompanyIdRef.current

    // If company_id changed, clear tenant state before fetching new one
    if (currentCompanyId && currentCompanyId !== previousCompanyId) {
      if (previousCompanyId !== null) {
        dispatch(clearTenant())
        tenantApi.clearTenant()
      }
      lastCompanyIdRef.current = currentCompanyId
      dispatch(fetchTenantDetails(currentCompanyId))
    }

    // If profile was cleared, also clear tenant
    if (!currentCompanyId && previousCompanyId !== null) {
      dispatch(clearTenant())
      tenantApi.clearTenant()
      lastCompanyIdRef.current = null
    }
  }, [profile, dispatch])

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
