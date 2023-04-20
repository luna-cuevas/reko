import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Define your Supabase project's public API URL and public anon key.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Check if the environment variables are defined and use type assertions
if (typeof SUPABASE_URL !== 'string') {
  throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_URL');
}

if (typeof SUPABASE_ANON_KEY !== 'string') {
  throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

// Create and export the Supabase client.
export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);