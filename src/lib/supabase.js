import { createClient } from '@supabase/supabase-js';

const supabaseUrl  = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnon = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnon) {
  console.warn('Supabase env vars missing — auth features disabled. See .env.example');
}

export const supabase = supabaseUrl && supabaseAnon
  ? createClient(supabaseUrl, supabaseAnon, {
      auth: {
        detectSessionInUrl:  false,  // prevents URL hash parsing race / lock warnings
        persistSession:      true,   // localStorage session persistence (default, explicit)
        autoRefreshToken:    true,   // keep token fresh silently
        storageKey:          'jiff-auth-token', // explicit key to avoid conflicts
      },
    })
  : null;
