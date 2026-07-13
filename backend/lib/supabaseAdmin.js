import { createClient } from '@supabase/supabase-js';

console.log('[SupabaseAdmin] SUPABASE_URL:', process.env.SUPABASE_URL)
console.log('[SupabaseAdmin] SERVICE_KEY_EXISTS:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default supabase;
