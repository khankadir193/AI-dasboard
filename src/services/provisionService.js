import { supabase } from '../lib/supabaseClient'
import { fetchProfile } from './profileService'

export async function ensureUserProvisioned(authUser) {
  if (!authUser?.id) {
    return null
  }

  const userId = authUser.id

  const existingProfile = await fetchProfile(userId)

  if (existingProfile?.company_id) {
    return existingProfile
  }

  try {
    const companyName = authUser.email
      ? authUser.email.split('@')[0] + "'s Company"
      : 'My Company'

    const { data: companyData, error: companyError } = await supabase
      .from('companies')
      .insert({ name: companyName })
      .select()
      .single()

    if (companyError) {
      throw companyError
    }

    const companyId = companyData.id

    if (existingProfile) {
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update({ company_id: companyId })
        .eq('id', userId)
        .select()
        .single()

      if (updateError) {
        throw updateError
      }

      return updatedProfile
    } else {
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
        throw profileError
      }

      return newProfile
    }
  } catch (error) {
    return null
  }
}
