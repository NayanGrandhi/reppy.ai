import { NextResponse } from "next/server";
import { supabaseAsUser } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supa = await supabaseAsUser();
  await supa.auth.signOut();
  return NextResponse.redirect(new URL("/login", req.url), { status: 303 });
}
