"use client";
import { Sparkles, Store } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { startWithSample } from "@/app/dashboard/actions";
import { AppHeader } from "@/components/app-header";
import { Button, ButtonLink } from "@/components/ui/button";

/** Signed in, but no business on the account yet. */
export function NoBusinessYet({ email }: { email: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-2xl px-5 py-16 md:py-24">
        <h1 className="display text-[44px] md:text-[52px]">Add your business</h1>
        <p className="mt-3 text-[15px] text-fg-2">Signed in as {email}. Your dashboard fills in once there&apos;s a business on this account.</p>
        <div className="mt-10 grid gap-px overflow-hidden rounded-[24px] bg-line ring-1 ring-line sm:grid-cols-2">
          <div className="bg-ink-900 p-6">
            <Store className="size-6 text-violet-300" />
            <h2 className="mt-4 text-[18px] font-medium">Set up your own business</h2>
            <p className="mt-2 text-[14px] text-fg-2">Share your rate card, website or notes and Reppy builds the business brain. Needs the Claude key.</p>
            <ButtonLink href="/setup" variant="secondary" size="sm" className="mt-5">
              Go to setup
            </ButtonLink>
          </div>
          <div className="bg-ink-900 p-6">
            <Sparkles className="size-6 text-teal-400" />
            <h2 className="mt-4 text-[18px] font-medium">Try it with the sample salon</h2>
            <p className="mt-2 text-[14px] text-fg-2">Get your own copy of Glow Studio&apos;s services, staff and hours. Book, cancel and edit for real. Free.</p>
            <Button
              size="sm"
              className="mt-5"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  setError(null);
                  const r = await startWithSample();
                  if (r.ok) router.refresh();
                  else setError(r.error);
                })
              }
            >
              {pending ? "Copying…" : "Use the sample salon"}
            </Button>
          </div>
        </div>
        {error && (
          <p role="alert" className="mt-4 text-[14px] text-bad">
            {error}
          </p>
        )}
        <form action="/auth/signout" method="post" className="mt-8">
          <button className="text-[13px] text-fg-3 hover:text-fg-2">Sign out</button>
        </form>
      </main>
    </>
  );
}
