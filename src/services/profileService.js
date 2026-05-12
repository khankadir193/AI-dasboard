import { supabase } from '../lib/supabaseClient'

/**
 * Fetch user profile with company data
 * @param {string} userId - The user ID
 * @returns {Promise<Object|null>} Profile with company or null
 */
export async function fetchProfile(userId) {
  if (!userId) {
    return null
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        companies:company_id (
          id,
          name
        )
      `)
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      return null
    }

    if (!data) {
      return null
    }

    return data
  } catch (e) {
    return null
  }
}
