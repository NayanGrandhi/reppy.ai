"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AppHeader } from "@/components/app-header";
import { ReviewStep } from "@/components/setup/review-step";
import { type ShareInput, ShareStep } from "@/components/setup/share-step";
import { useStatus } from "@/components/setup/use-status";
import { demoBrains } from "@/lib/brain/demo";
import type { Brain, Missing } from "@/lib/brain/schema";
import { cn } from "@/lib/utils";

type Source = { kind: "website" | "image" | "pdf" | "text"; label: string };

export default function SetupPage() {
  const router = useRouter();
  const status = useStatus();
  const [step, setStep] = useState<"share" | "review">("share");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [brain, setBrain] = useState<Brain | null>(null);
  const [missing, setMissing] = useState<Missing[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [code, setCode] = useState("");

  const extract = async (input: ShareInput) => {
    setBusy(true);
    setError(null);
    setCode(input.code);
    const form = new FormData();
    input.files.forEach((f) => form.append("files", f));
    form.set("url", input.url);
    form.set("notes", input.notes);
    form.set("type", input.type);
    form.set("code", input.code);
    try {
      const res = await fetch("/api/brain/extract", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
      setBrain(data.brain);
      setMissing(data.missing ?? []);
      setWarnings(data.warnings ?? []);
      setSources(data.sources ?? []);
      setStep("review");
      window.scrollTo({ top: 0 });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    if (!brain) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/brain", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ brain, sources, code }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't save.");
      router.push(`/chat/${data.slug}?new=1`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save.");
      setBusy(false);
    }
  };

  return (
    <>
      <AppHeader active="setup" />
      <main className="mx-auto max-w-6xl px-5 py-10 md:px-8 md:py-14">
        <ol className="mb-8 flex items-center gap-3 text-[13px]" aria-label="Progress">
          {["Share what you have", "Check what Reppy learned", "Chat with Reppy"].map((label, i) => {
            const current = (step === "share" && i === 0) || (step === "review" && i === 1);
            const done = step === "review" && i === 0;
            return (
              <li key={label} className={cn("flex items-center gap-2", current ? "text-fg" : done ? "text-fg-2" : "text-fg-3")}>
                <span className={cn("grid size-6 place-items-center rounded-full text-[12px] ring-1", current ? "bg-violet-500 text-white ring-violet-500" : done ? "ring-teal-500/50 text-teal-400" : "ring-line")}>
                  {i + 1}
                </span>
                <span className="hidden sm:inline">{label}</span>
                {i < 2 && <span className="mx-1 h-px w-6 bg-line" />}
              </li>
            );
          })}
        </ol>

        {step === "share" ? (
          <>
            <h1 className="display text-[44px] md:text-[56px]">Teach Reppy your business</h1>
            <p className="mt-3 mb-10 max-w-2xl text-[16px] text-fg-2">
              Share anything you already have. Reppy reads it, builds a business brain, and shows you what it learned before anything goes live.
            </p>
            <ShareStep
              status={status}
              busy={busy}
              error={error}
              onSubmit={extract}
              onUseSample={(slug) => {
                const d = demoBrains.find((b) => b.slug === slug)!;
                setBrain({ ...structuredClone(d.brain), name: `${d.brain.name} (copy)` });
                setMissing([]);
                setWarnings([]);
                setSources([{ kind: "text", label: `Sample: ${d.brain.name}` }]);
                setStep("review");
              }}
            />
          </>
        ) : (
          brain && (
            <>
              <p className="text-[13.5px] text-fg-3">Here&apos;s what Reppy knows about</p>
              <h1 className="display mt-1 mb-8 text-[44px] md:text-[56px]">{brain.name || "your business"}</h1>
              <ReviewStep
                brain={brain}
                setBrain={setBrain}
                missing={missing}
                warnings={warnings}
                saving={busy}
                error={error}
                onSave={save}
                onBack={() => {
                  setStep("share");
                  setBrain(null);
                  setError(null);
                }}
              />
            </>
          )
        )}
      </main>
    </>
  );
}
