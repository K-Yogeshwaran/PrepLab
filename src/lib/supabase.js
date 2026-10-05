import { createClient } from '@supabase/supabase-js';

// Retrieve environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Check whether Supabase environment variables are properly configured
 * and not set to dummy placeholder values.
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
 * Returns diagnostic details about the Supabase configuration.
 */
export function getSupabaseConfigStatus() {
  const configured = isSupabaseConfigured();
  return {
    isConfigured: configured,
    hasUrl: Boolean(supabaseUrl && !supabaseUrl.includes('YOUR_SUPABASE')),
    hasKey: Boolean(supabasePublishableKey && !supabasePublishableKey.includes('YOUR_SUPABASE')),
    url: supabaseUrl || null,
  };
}

// Create the Supabase client instance safely.
// If credentials are not yet configured, create a dummy or null instance
// to prevent instant unhandled application crashes on boot.
export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null;
