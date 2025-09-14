// src/lib/supabaseAdmin.ts
import { createClient } from '@supabase/supabase-js';

export const supabaseAdmin = createClient(
  import.meta.env.SUPABASE_URL,
  import.meta.env.SUPABASE_SERVICE_ROLE_KEY, // must be kept secret
  {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  }
);

