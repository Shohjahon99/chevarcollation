import { createClient } from "@supabase/supabase-js";

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string).trim().replace(/[^\x20-\x7E]/g, '');
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string).trim().replace(/[^\x20-\x7E]/g, '');

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});
