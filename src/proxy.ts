import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/supabase/config";

// Keeps the owner's sign-in fresh. Supabase sign-ins expire hourly; this
// renews them before dashboard pages read who is signed in.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supa = createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        for (const { name, value } of list) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of list) response.cookies.set(name, value, options);
      },
    },
  });
  await supa.auth.getUser();
  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/setup/:path*", "/api/brain/:path*"],
};
