import { supabase } from '../lib/supabaseClient'

/**
 * Fetch user profile with company data
 * @param {string} userId - The user ID
 * @returns {Promise<Object|null>} Profile with company or null
 */
export async function fetchProfile(userId) {
  if (!userId) {
    console.log('[profileService] fetchProfile called with null/undefined userId')
    return null
  }
  
  try {
    console.log('[profileService] Fetching profile for userId:', userId)
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*, companies(*)')
      .eq('id', userId)
      .single()
    
    if (error) {
      // Log the specific error for debugging
      console.log('[profileService] Profile fetch error:', {
        code: error.code,
        message: error.message,
        details: error.details
      })
      return null
    }
    
    if (!data) {
      console.log('[profileService] No profile found for userId:', userId)
      return null
    }
    
    // Detailed logging for debugging
    console.log('[profileService] Profile fetched successfully:', {
      id: data?.id,
      company_id: data?.company_id,
      role: data?.role,
      has_company: !!data?.company_id
    })
    
    return data
  } catch (e) {
    console.log('[profileService] Fetch exception:', e.message)
    return null
  }
}
