"use client";
import { MailCheck } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/controls";
import { supabaseBrowser } from "@/lib/supabase/browser";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  if (state === "sent") {
    return (
      <div className="mt-8 rounded-2xl bg-teal-500/[0.08] p-5 ring-1 ring-teal-500/30">
        <MailCheck className="size-6 text-teal-400" />
        <p className="mt-3 text-[15px]">
          Check <span className="font-medium">{email}</span> for a sign-in link. Open it in this browser.
        </p>
        <p className="mt-2 text-[13px] text-fg-3">Not there after a minute? Look in spam, or</p>
        <button className="mt-1 text-[13px] text-violet-300 hover:underline" onClick={() => setState("idle")}>
          use a different email
        </button>
      </div>
    );
  }

  return (
    <form
      className="mt-8 space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setState("sending");
        setError(null);
        const { error } = await supabaseBrowser().auth.signInWithOtp({
          email: email.trim(),
          options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard` },
        });
        if (error) {
          setState("idle");
          setError(
            error.status === 429
              ? "Too many sign-in emails just now. Wait a few minutes and try again."
              : "We couldn't send the email. Check the address and try again.",
          );
        } else setState("sent");
      }}
    >
      <Field label="Email">
        <Input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@yourbusiness.in" />
      </Field>
      {error && (
        <p role="alert" className="text-[13.5px] text-bad">
          {error}
        </p>
      )}
      <Button type="submit" className="w-full" disabled={state === "sending" || !email.trim()}>
        {state === "sending" ? "Sending…" : "Email me a sign-in link"}
      </Button>
    </form>
  );
}
