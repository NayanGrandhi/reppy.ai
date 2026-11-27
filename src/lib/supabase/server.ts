import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./config";

/**
 * Supabase as the signed-in owner. Every query runs under row-level
 * security, so it can only ever read or change that owner's business.
 */
export async function supabaseAsUser() {
  const store = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          for (const { name, value, options } of list) store.set(name, value, options);
        } catch {
          // Server Components can't set cookies; the proxy refreshes the session instead.
        }
      },
    },
  });
}

/** The signed-in user, or null. Verified with Supabase, not just read from the cookie. */
export async function currentUser() {
  const supa = await supabaseAsUser();
  const { data } = await supa.auth.getUser();
  return data.user ?? null;
}
