"use client";
import { useEffect } from "react";
import { Button, ButtonLink } from "@/components/ui/button";

// Shown when a page crashes, instead of a blank screen.
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => console.error(error), [error]);
  return (
    <main className="grid min-h-[70dvh] place-items-center px-6">
      <div className="text-center">
        <h1 className="display text-[40px]">Something went wrong on this page</h1>
        <p className="mx-auto mt-3 max-w-md text-[15px] text-fg-2">Try again. If it keeps happening, reload the page or come back in a few minutes.</p>
        <div className="mt-7 flex justify-center gap-3">
          <Button onClick={reset}>Try again</Button>
          <ButtonLink href="/" variant="secondary">
            Home page
          </ButtonLink>
        </div>
      </div>
    </main>
  );
}
