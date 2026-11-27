// Public connection details for the Supabase project. These are safe to ship
// in the website: the publishable key only allows what row-level security
// permits (an owner sees only their own business). The secret service-role
// key is never here; it lives in Vercel as SUPABASE_SERVICE_ROLE_KEY.
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "https://sqggxhfetsqdmjkwgagy.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_S8vTyMIcM94NlP8EJScybQ_00Mi5a7l";
