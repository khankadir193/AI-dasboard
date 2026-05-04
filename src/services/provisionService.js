import { supabase } from '../lib/supabaseClient'
import { fetchProfile } from './profileService'

/**
 * Ensure user has a company and profile.
 * Only creates if profile doesn't exist OR profile.company_id is NULL.
 * This handles edge cases where the database trigger might have failed.
 * 
 * @param {Object} authUser - Supabase auth user
 * @returns {Promise<Object>} Profile with company_id
 */
export async function ensureUserProvisioned(authUser) {
  if (!authUser?.id) {
    console.log('[provisionService] No auth user, cannot provision')
    return null
  }
  
  const userId = authUser.id
  console.log('[provisionService] Checking provisioning for user:', userId)
  
  // Check if profile already exists with company_id
  const existingProfile = await fetchProfile(userId)
  
  if (existingProfile?.company_id) {
    console.log('[provisionService] Profile already has company_id, skipping provision')
    return existingProfile
  }
  
  // Profile doesn't exist or has no company_id - need to provision
  console.log('[provisionService] Need to provision company for user:', userId)
  
  try {
    // First check if company already exists but wasn't linked
    // This handles edge case where trigger created company but failed to link
    const companyName = authUser.email 
      ? authUser.email.split('@')[0] + "'s Company" 
      : 'My Company'
    
    // Create company
    const { data: companyData, error: companyError } = await supabase
      .from('companies')
      .insert({ name: companyName })
      .select()
      .single()
    
    if (companyError) {
      console.error('[provisionService] Company creation failed:', companyError.message)
      // Check if company already exists (might be from failed previous attempt)
      if (companyError.code === '23505') {
        console.log('[provisionService] Company might already exist, trying to recover...')
      }
      throw companyError
    }
    
    const companyId = companyData.id
    console.log('[provisionService] Company created:', companyId)
    
    // Create or update profile with company_id
    if (existingProfile) {
      // Profile exists but company_id was null - update it
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update({ company_id: companyId })
        .eq('id', userId)
        .select()
        .single()
      
      if (updateError) {
        console.error('[provisionService] Profile update failed:', updateError.message)
        throw updateError
      }
      
      console.log('[provisionService] Profile updated with company_id:', companyId)
      return updatedProfile
    } else {
      // Create new profile
      const { data: newProfile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          company_id: companyId,
          role: 'admin'
        })
        .select()
        .single()
      
      if (profileError) {
        console.error('[provisionService] Profile creation failed:', profileError.message)
        throw profileError
      }
      
      console.log('[provisionService] Profile created with company_id:', companyId)
      return newProfile
    }
  } catch (error) {
    console.error('[provisionService] Provisioning error:', error.message)
    return null
  }
}
