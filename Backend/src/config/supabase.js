import { createClient } from '@supabase/supabase-js';
import { config } from './env.js';

// Service role client — full access for server-side operations
export const supabaseAdmin = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey || config.supabase.anonKey, // Fallback safely
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Anon client — for operations that should respect RLS
export const supabaseAnon = createClient(
  config.supabase.url,
  config.supabase.anonKey
);
