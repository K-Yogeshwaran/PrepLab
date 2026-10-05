import { createClient } from '@supabase/supabase-js';

// Retrieve environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Check whether Supabase environment variables are present and not placeholder values.
 */
export function isSupabaseConfigured() {
  if (!supabaseUrl || !supabasePublishableKey) {
    return false;
  }
  const isPlaceholderUrl =
    supabaseUrl.includes('YOUR_SUPABASE_PROJECT_URL') ||
    supabaseUrl.includes('placeholder') ||
    !supabaseUrl.startsWith('https://');

  const isPlaceholderKey =
    supabasePublishableKey.includes('YOUR_SUPABASE_PUBLISHABLE_KEY') ||
    supabasePublishableKey.includes('placeholder') ||
    supabasePublishableKey.length < 20;

  return !isPlaceholderUrl && !isPlaceholderKey;
}

/**
 * Single central Supabase client instance.
 */
export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null;

/**
 * Performs a lightweight real query to verify live database connectivity and policies.
 * Returns { connected: boolean, state: 'Connected' | 'Connection Error', error: string | null }
 */
export async function verifySupabaseConnection() {
  if (!isSupabaseConfigured() || !supabase) {
    return {
      connected: false,
      state: 'Connection Error',
      error: 'Supabase credentials are not configured in .env.local',
    };
  }

  try {
    const { error } = await supabase.from('topics').select('id').limit(1);
    if (error) {
      return {
        connected: false,
        state: 'Connection Error',
        error: error.message || 'Database query error',
      };
    }
    return {
      connected: true,
      state: 'Connected',
      error: null,
    };
  } catch (err) {
    return {
      connected: false,
      state: 'Connection Error',
      error: err.message || 'Network connection failed',
    };
  }
}
