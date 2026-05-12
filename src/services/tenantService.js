import { supabase } from '../lib/supabaseClient'

/**
 * Fetch tenant details by ID
 */
export const fetchTenantDetails = async (tenantId) => {
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('id', tenantId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) throw new Error('Company not found')

  return data
}

/**
 * Update tenant settings
 */
export const updateTenantSettings = async (tenantId, settings) => {
  const { data, error } = await supabase
    .from('companies')
    .update({ settings })
    .eq('id', tenantId)
    .select()
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) throw new Error('Company update failed')

  return data
}

/**
 * Fetch tenant users
 */
export const fetchTenantUsers = async (tenantId) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('company_id', tenantId)

  if (error) throw new Error(error.message)

  return data
}
