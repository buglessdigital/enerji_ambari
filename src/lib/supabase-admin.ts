import { createClient } from '@supabase/supabase-js'

// Service role key ile RLS bypass — sadece server-side API route'larında kullan
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
