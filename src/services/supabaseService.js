import { createClient } from '@supabase/supabase-js'

// Supabase client configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flow: 'pkce' // Recommended for web apps
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

// Database helpers
export const db = {
  // Generic query builder
  from: (table) => supabase.from(table),
  
  // Profile helpers
  getProfile: (userId) => supabase
    .from('profiles')
    .select(`
      id,
      role,
      company_id,
      companies (
        id,
        name,
        created_at
      )
    `)
    .eq('id', userId)
    .single(),
    
  updateProfile: (userId, updates) => supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single(),
    
  // Company helpers
  getCompany: (companyId) => supabase
    .from('companies')
    .select('*')
    .eq('id', companyId)
    .single(),
    
  updateCompany: (companyId, updates) => supabase
    .from('companies')
    .update(updates)
    .eq('id', companyId)
    .select()
    .single(),
    
  // Realtime subscriptions
  subscribe: (table, callback) => {
    return supabase
      .channel(`${table}_changes`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: table 
        }, 
        callback
      )
      .subscribe()
  },
  
  unsubscribe: (subscription) => {
    supabase.removeChannel(subscription)
  }
}

// Export supabase client for direct usage
export default supabase
