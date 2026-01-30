import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || window.location.origin
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseAnonKey) {
  console.error('Missing VITE_SUPABASE_ANON_KEY environment variable. API calls will fail.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey || 'missing-key', {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})
