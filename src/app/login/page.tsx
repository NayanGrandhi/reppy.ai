import { redirect } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { currentUser } from "@/lib/supabase/server";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sign in", robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await currentUser()) redirect("/dashboard");
  const { error } = await searchParams;
  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-md px-5 py-16 md:py-24">
        <h1 className="display text-[44px]">Sign in to your dashboard</h1>
        <p className="mt-3 text-[15px] text-fg-2">We&apos;ll email you a sign-in link. No password to remember.</p>
        {error && (
          <p role="alert" className="mt-6 rounded-xl bg-bad/10 p-3 text-[14px] text-bad ring-1 ring-bad/30">
            That sign-in link didn&apos;t work. It may have expired or been opened in a different browser. Ask for a new one below.
          </p>
        )}
        <LoginForm />
      </main>
    </>
  );
}
