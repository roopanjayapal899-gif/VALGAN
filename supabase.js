// VOLGAN - Supabase Configuration

const SUPABASE_URL = "https://jinliwexcvemljlybjhn.supabase.co";

const SUPABASE_ANON_KEY = "sb_publishable_7E--ZAkuNXkpFBw7uBop5A_2O3RTA9y";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);