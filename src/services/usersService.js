import { supabase } from '../lib/supabaseClient'

/**
 * Fetch all users for the current user's company
 */
export const fetchAllUsers = async () => {
  // Determine tenant scope from currently logged-in user profile (company_id)
  const {
    data: { user: authUser },
    error: authUserError
  } = await supabase.auth.getUser()

  if (authUserError) {
    throw new Error(authUserError.message)
  }

  const authUid = authUser?.id
  if (!authUid) {
    return []
  }

  const { data: myProfile, error: myProfileError } = await supabase
    .from('profiles')
    .select('id, company_id')
    .eq('id', authUid)
    .maybeSingle()

  if (myProfileError) throw new Error(myProfileError.message || 'Failed to fetch profile')
  if (!myProfile?.company_id) return []

  const tenantCompanyId = myProfile.company_id

  // Fetch profiles for ONLY the logged-in user's company, and join the company name
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select(`
      *,
      companies:company_id (
        id,
        name
      )
    `)
    .eq('company_id', tenantCompanyId)

  if (error) {
    throw new Error(error.message || 'Failed to fetch users')
  }

  const users = (profiles || []).map((profile) => {
    const email = profile?.email || ''

    // Prefer first_name/last_name when present; fallback to email prefix
    const first = (profile?.first_name || '').trim()
    const last = (profile?.last_name || '').trim()
    const fullName = [first, last].filter(Boolean).join(' ').trim()

    const emailPrefix = email.split('@')[0] || 'user'
    const fallbackName = emailPrefix
      .replace(/[._-]/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())

    const displayName = fullName || fallbackName || 'Unknown'

    // Handle company data shape - Supabase join may return object or array depending on relation
    const companyData = profile?.companies
    const companyObj = Array.isArray(companyData) ? companyData[0] : companyData
    const companyName = companyObj?.name ?? null

    return {
      id: profile.id,
      email,
      role: profile.role || 'viewer',
      is_active: profile.is_active !== false,
      created_at: profile.created_at,
      company_id: profile.company_id,
      permissions: profile.permissions,
      avatar_url: profile.avatar_url,
      updated_at: profile.updated_at,
      displayName,
      company: { name: companyName }
    }
  })

  return users
}

/**
 * Update user role
 */
export const updateUserRole = async ({ userId, role }) => {
  const { data, error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', userId)
    .select()
    .maybeSingle()

  if (error) throw new Error(error.message || 'Failed to update user role')
  return data
}

/**
 * Toggle user status
 */
export const toggleUserStatus = async ({ userId, is_active }) => {
  const { data, error } = await supabase
    .from('profiles')
    .update({ is_active })
    .eq('id', userId)
    .select()
    .maybeSingle()

  if (error) throw new Error(error.message || 'Failed to toggle user status')
  return data
}
