import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase public env vars.');
}

export const supabasePublic = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: true }
});

export const supabaseServer = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false }
});

export const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } })
  : null;
