import { supabase } from '../lib/supabaseClient'

const SEARCH_LIMIT = 5
const MIN_QUERY_LENGTH = 2

export async function searchAll({ companyId, query }) {
  if (!companyId || !query || query.trim().length < MIN_QUERY_LENGTH) {
    return { projects: [], users: [], activities: [], notifications: [] }
  }

  const term = query.trim()

  const [projects, users, activities, notifications] = await Promise.all([
    searchProjects(companyId, term),
    searchUsers(companyId, term),
    searchActivities(companyId, term),
    searchNotifications(companyId, term),
  ])

  return { projects, users, activities, notifications }
}

async function searchProjects(companyId, term) {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('id, name, status')
      .eq('company_id', companyId)
      .ilike('name', `%${term}%`)
      .limit(SEARCH_LIMIT)

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('[searchService] searchProjects error:', error)
    return []
  }
}

async function searchUsers(companyId, term) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email, role')
      .eq('company_id', companyId)
      .or(`first_name.ilike.%${term}%,last_name.ilike.%${term}%,email.ilike.%${term}%`)
      .limit(SEARCH_LIMIT)

    if (error) throw error
    return (data || []).map((u) => ({
      ...u,
      displayName: [u.first_name, u.last_name].filter(Boolean).join(' ') || u.email,
    }))
  } catch (error) {
    console.error('[searchService] searchUsers error:', error)
    return []
  }
}

async function searchActivities(companyId, term) {
  try {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('id, action, description, created_at')
      .eq('company_id', companyId)
      .ilike('description', `%${term}%`)
      .order('created_at', { ascending: false })
      .limit(SEARCH_LIMIT)

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('[searchService] searchActivities error:', error)
    return []
  }
}

async function searchNotifications(companyId, term) {
  try {
    const { data, error } = await supabase
      .from('analytics_data')
      .select('id, metric_type, metric_value, created_at, metadata')
      .eq('company_id', companyId)
      .ilike('metric_type', `%${term}%`)
      .order('created_at', { ascending: false })
      .limit(SEARCH_LIMIT)

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('[searchService] searchNotifications error:', error)
    return []
  }
}
