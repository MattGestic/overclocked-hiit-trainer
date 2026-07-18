import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabasePublishableKey) {
  console.warn(
    'Supabase env vars are not set (VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY). ' +
    'Copy .env.example to .env and fill in your OverClocked HITT project credentials.'
  )
}

export const supabase = supabaseUrl && supabasePublishableKey
  ? createClient(supabaseUrl, supabasePublishableKey)
  : null
