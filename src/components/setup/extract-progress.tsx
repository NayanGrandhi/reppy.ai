"use client";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const STEPS = [
  { at: 0, label: "Uploading what you shared" },
  { at: 3, label: "Reading photos, PDFs and your website" },
  { at: 12, label: "Finding services and prices" },
  { at: 24, label: "Checking timings, staff and policies" },
  { at: 36, label: "Looking for anything missing" },
];

/** Friendly progress while the AI reads (it usually takes 20–60 seconds). */
export function ExtractProgress({ fileCount, hasUrl }: { fileCount: number; hasUrl: boolean }) {
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);
  const current = STEPS.reduce((acc, s, i) => (secs >= s.at ? i : acc), 0);
  // Eases toward 92% so it never looks "stuck at 100%".
  const pct = Math.round(92 * (1 - Math.exp(-secs / 22)));

  return (
    <div className="panel mx-auto max-w-xl p-7" role="status" aria-live="polite">
      <h2 className="display text-[30px]">Reppy is reading your business</h2>
      <p className="mt-1 text-[14px] text-fg-3">
        {fileCount > 0 ? `${fileCount} file${fileCount > 1 ? "s" : ""}` : "Your notes"}
        {hasUrl ? " and your website" : ""}. This usually takes 20–60 seconds.
      </p>
      <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-ink-700">
        <motion.div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-saffron-500" animate={{ width: `${pct}%` }} transition={{ ease: "easeOut", duration: 0.9 }} />
      </div>
      <ol className="mt-6 space-y-3">
        {STEPS.map((s, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <li key={s.label} className={cn("flex items-center gap-3 text-[14.5px] transition-colors", done ? "text-fg-2" : active ? "text-fg" : "text-fg-3/60")}>
              <span className={cn("grid size-6 shrink-0 place-items-center rounded-full ring-1", done ? "bg-teal-500/15 text-teal-400 ring-teal-500/30" : active ? "text-violet-300 ring-violet-500/40" : "ring-line")}>
                <AnimatePresence mode="wait">
                  {done ? (
                    <motion.span key="d" initial={{ scale: 0.5 }} animate={{ scale: 1 }}>
                      <Check className="size-3.5" />
                    </motion.span>
                  ) : active ? (
                    <Loader2 key="a" className="size-3.5 animate-spin" />
                  ) : null}
                </AnimatePresence>
              </span>
              {s.label}
            </li>
          );
        })}
      </ol>
      {secs > 75 && <p className="mt-6 text-[13px] text-fg-3">Taking longer than usual. Big PDFs can do this; it's still working.</p>}
    </div>
  );
}
