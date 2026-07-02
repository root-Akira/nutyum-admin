import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE

if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, or VITE_SUPABASE_SERVICE_ROLE env vars')
}

// Auth client uses anon key (for signIn/signOut/session management)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Admin client uses service role key (bypasses RLS for data operations)
// Disable session persistence so it doesn't pick up the user JWT from auth client
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
})
