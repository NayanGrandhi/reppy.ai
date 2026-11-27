"use client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AppHeader } from "@/components/app-header";
import { rememberBusiness } from "@/components/chat/my-businesses";
import { ExtractProgress } from "@/components/setup/extract-progress";
import { ReviewStep } from "@/components/setup/review-step";
import { type ShareInput, ShareStep } from "@/components/setup/share-step";
import { useStatus } from "@/components/setup/use-status";
import { demoBrains } from "@/lib/brain/demo";
import { type Brain, emptyBrain, type Missing } from "@/lib/brain/schema";
import { cn } from "@/lib/utils";

type Source = { kind: "website" | "image" | "pdf" | "text"; label: string };
type Draft = { brain: Brain; missing: Missing[]; warnings: string[]; sources: Source[] };
const DRAFT_KEY = "reppy.setupDraft";

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
  const [reading, setReading] = useState<{ files: number; url: boolean } | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const saved = useRef(false);

  // Keep the review in this browser tab so a refresh doesn't lose edits.
  useEffect(() => {
    try {
      const d = sessionStorage.getItem(DRAFT_KEY);
      if (d) setDraft(JSON.parse(d));
    } catch {}
  }, []);
  useEffect(() => {
    if (step !== "review" || !brain) return;
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ brain, missing, warnings, sources }));
    } catch {}
  }, [step, brain, missing, warnings, sources]);
  useEffect(() => {
    if (step !== "review") return;
    const warn = (e: BeforeUnloadEvent) => {
      if (!saved.current) e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [step]);

  const openReview = (d: Draft) => {
    setBrain(d.brain);
    setMissing(d.missing);
    setWarnings(d.warnings);
    setSources(d.sources);
    setStep("review");
    window.scrollTo({ top: 0 });
  };

  const extract = async (input: ShareInput) => {
    setBusy(true);
    setError(null);
    setCode(input.code);
    setReading({ files: input.files.length, url: Boolean(input.url.trim()) });
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
      openReview({ brain: data.brain, missing: data.missing ?? [], warnings: data.warnings ?? [], sources: data.sources ?? [] });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
      setReading(null);
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
      rememberBusiness({ slug: data.slug, name: brain.name, type: brain.type });
      saved.current = true;
      try {
        sessionStorage.removeItem(DRAFT_KEY);
      } catch {}
      // Signed-in owners land on their dashboard; everyone else tries the chat.
      router.push(data.owned ? "/dashboard" : `/chat/${data.slug}?new=1`);
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
                <span className={cn("grid size-6 place-items-center rounded-full text-[12px] ring-1", current ? "bg-violet-600 text-white ring-violet-500" : done ? "ring-teal-500/50 text-teal-400" : "ring-line")}>
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
            {draft && !reading && (
              <div className="mb-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-violet-500/[0.08] px-5 py-4 ring-1 ring-violet-500/25">
                <p className="text-[14px]">
                  You have an unsaved review for <span className="font-medium">{draft.brain.name || "a business"}</span>.
                </p>
                <div className="flex gap-2">
                  <button onClick={() => openReview(draft)} className="rounded-full bg-violet-600 px-4 py-1.5 text-[13px] font-medium text-white hover:bg-violet-700">
                    Continue
                  </button>
                  <button
                    onClick={() => {
                      setDraft(null);
                      try {
                        sessionStorage.removeItem(DRAFT_KEY);
                      } catch {}
                    }}
                    className="rounded-full px-4 py-1.5 text-[13px] text-fg-3 hover:text-fg"
                  >
                    Discard
                  </button>
                </div>
              </div>
            )}
            {reading && <ExtractProgress fileCount={reading.files} hasUrl={reading.url} />}
            <div className={reading ? "hidden" : ""}>
            <ShareStep
              status={status}
              busy={busy}
              error={error}
              onSubmit={extract}
              onManual={() => {
                // Start with sensible defaults the owner edits: Mon–Sat 10–7, Sunday closed.
                const b = emptyBrain();
                b.hours = (["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const).map((day) =>
                  day === "Sunday" ? { day, open: "", close: "", closed: true } : { day, open: "10:00", close: "19:00", closed: false },
                );
                b.services = [{ name: "", category: "", priceINR: null, priceNote: "", durationMin: 30, staff: [] }];
                openReview({ brain: b, missing: [], warnings: [], sources: [{ kind: "text", label: "Typed in by the owner" }] });
              }}
              onUseSample={(slug) => {
                const d = demoBrains.find((b) => b.slug === slug)!;
                openReview({ brain: { ...structuredClone(d.brain), name: `${d.brain.name} (copy)` }, missing: [], warnings: [], sources: [{ kind: "text", label: `Sample: ${d.brain.name}` }] });
              }}
            />
            </div>
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
                  try {
                    sessionStorage.removeItem(DRAFT_KEY);
                  } catch {}
                  setDraft(null);
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
