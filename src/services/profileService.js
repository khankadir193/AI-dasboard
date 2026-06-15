import { supabase } from '../lib/supabaseClient'

const PROFILE_REQUEST_TIMEOUT_MS = 8000

const withTimeout = (promise, label) => {
  let timeoutId
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`${label} timed out`))
    }, PROFILE_REQUEST_TIMEOUT_MS)
  })

  return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId))
}

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
    const { data, error } = await withTimeout(
      supabase
        .from('profiles')
        .select(`
          *,
          companies:company_id (
            id,
            name
          )
        `)
        .eq('id', userId)
        .maybeSingle(),
      'fetchProfile'
    )

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
