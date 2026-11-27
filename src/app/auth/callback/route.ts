import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { supabaseAsUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Where the emailed sign-in link lands. Swaps the one-time code for a session. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const next = url.searchParams.get("next") ?? "/dashboard";
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
  const supa = await supabaseAsUser();

  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const { error } = code
    ? await supa.auth.exchangeCodeForSession(code)
    : tokenHash && type
      ? await supa.auth.verifyOtp({ token_hash: tokenHash, type })
      : { error: new Error("missing code") };

  return NextResponse.redirect(new URL(error ? "/login?error=link" : safeNext, url.origin));
}
