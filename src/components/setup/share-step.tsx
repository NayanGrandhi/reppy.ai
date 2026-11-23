"use client";
import { FileText, Globe, ImagePlus, Loader2, Mic, Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/controls";
import { BUSINESS_TYPES } from "@/lib/brain/schema";
import { cn } from "@/lib/utils";
import { shrinkImage, type Status } from "./use-status";

export interface ShareInput {
  files: File[];
  url: string;
  notes: string;
  type: string;
  code: string;
}

export function ShareStep({
  status,
  busy,
  error,
  onSubmit,
  onUseSample,
}: {
  status: Status | null;
  busy: boolean;
  error: string | null;
  onSubmit: (input: ShareInput) => void;
  onUseSample: (which: "glow-studio" | "mehta-family-clinic") => void;
}) {
  const [files, setFiles] = useState<File[]>([]);
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [type, setType] = useState("");
  const [code, setCode] = useState("");
  const [drag, setDrag] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const add = async (list: FileList | null) => {
    if (!list) return;
    setFileError(null);
    const accepted: File[] = [];
    for (const f of Array.from(list)) {
      if (f.type.startsWith("audio/")) {
        setFileError("Voice notes arrive with the WhatsApp phase. For now, type what you'd say in the notes box.");
        continue;
      }
      if (!f.type.startsWith("image/") && f.type !== "application/pdf") {
        setFileError(`${f.name} isn't a photo or PDF.`);
        continue;
      }
      accepted.push(await shrinkImage(f));
    }
    setFiles((prev) => {
      const next = [...prev, ...accepted].slice(0, 6);
      const total = next.reduce((s, f) => s + f.size, 0);
      if (total > 4 * 1024 * 1024) {
        setFileError("Files are over 4 MB together. Remove a large PDF or use fewer photos.");
      }
      return next;
    });
  };

  const total = files.reduce((s, f) => s + f.size, 0);
  const canSubmit = !busy && (files.length > 0 || url.trim() || notes.trim()) && total <= 4 * 1024 * 1024 && (!status?.setupCodeRequired || code);

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
      <form
        className="space-y-7"
        onSubmit={(e) => {
          e.preventDefault();
          if (canSubmit) onSubmit({ files, url, notes, type, code });
        }}
      >
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            add(e.dataTransfer.files);
          }}
          className={cn(
            "rounded-3xl border-2 border-dashed p-8 text-center transition-colors",
            drag ? "border-violet-400 bg-violet-500/[0.06]" : "border-line-strong bg-white/[0.015]",
          )}
        >
          <ImagePlus className="mx-auto size-8 text-violet-300" strokeWidth={1.5} />
          <p className="mt-3 text-[16px] font-medium">Drop photos or PDFs here</p>
          <p className="mt-1 text-[14px] text-fg-3">Rate card, menu, price list, or screenshots of your Google Maps and Instagram pages.</p>
          <Button type="button" variant="secondary" size="sm" className="mt-5" onClick={() => input.current?.click()}>
            <Upload className="size-3.5" /> Choose files
          </Button>
          <input ref={input} type="file" multiple accept="image/*,application/pdf" className="hidden" onChange={(e) => add(e.target.files)} />
          {files.length > 0 && (
            <ul className="mx-auto mt-6 max-w-md space-y-2 text-left">
              {files.map((f, i) => (
                <li key={`${f.name}-${i}`} className="flex items-center gap-3 rounded-xl bg-ink-800 px-3 py-2 text-[13.5px] ring-1 ring-line">
                  {f.type === "application/pdf" ? <FileText className="size-4 text-fg-3" /> : <ImagePlus className="size-4 text-fg-3" />}
                  <span className="min-w-0 flex-1 truncate">{f.name}</span>
                  <span className="text-[12px] text-fg-3 tabular-nums">{Math.round(f.size / 1024)} KB</span>
                  <button type="button" onClick={() => setFiles((x) => x.filter((_, j) => j !== i))} aria-label={`Remove ${f.name}`} className="rounded p-0.5 text-fg-3 hover:text-fg">
                    <X className="size-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {fileError && <p className="mt-4 text-[13px] text-saffron-400">{fileError}</p>}
        </div>

        <Field label="Website" hint="Reppy reads it only if the site allows it. Instagram and Google Maps links aren't read — upload screenshots instead.">
          <div className="relative">
            <Globe className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-fg-3" />
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="glowstudio.in" className="pl-10" inputMode="url" />
          </div>
        </Field>

        <Field label="Anything else, in your own words" hint="Timings, who works when, policies, common questions. Hinglish is fine.">
          <Textarea rows={5} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={"Tuesday band rehta hai. Anita senior stylist hai, Rahul Wednesday off.\n₹200 advance for bridal bookings."} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Type of business" hint="Leave on auto and Reppy will work it out.">
            <Select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="">Detect automatically</option>
              {BUSINESS_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </Select>
          </Field>
          {status?.setupCodeRequired && (
            <Field label="Access code" hint="Keeps strangers from using your AI credit.">
              <Input value={code} onChange={(e) => setCode(e.target.value)} type="password" autoComplete="off" />
            </Field>
          )}
        </div>

        {error && <p className="rounded-2xl bg-bad/10 px-4 py-3 text-[14px] text-bad ring-1 ring-bad/25">{error}</p>}

        <div className="flex flex-wrap items-center gap-4">
          <Button type="submit" size="lg" disabled={!canSubmit}>
            {busy ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Reading your business…
              </>
            ) : (
              "Build my business brain"
            )}
          </Button>
          {busy && <span className="text-[13px] text-fg-3">Usually 20–60 seconds.</span>}
        </div>
      </form>

      <aside className="space-y-6 lg:pt-2">
        {status && !status.ai && (
          <div className="rounded-2xl bg-saffron-500/[0.08] p-4 text-[13.5px] text-fg-2 ring-1 ring-saffron-500/25">
            <div className="font-medium text-saffron-400">AI not switched on yet</div>
            Reading photos needs the Claude API key. Until it&apos;s added, start from a sample business below.
          </div>
        )}
        <div className="rounded-2xl p-5 ring-1 ring-line">
          <h2 className="text-[15px] font-medium">No files handy?</h2>
          <p className="mt-1 text-[13.5px] text-fg-3">Start from a sample and edit it on the next screen.</p>
          <div className="mt-4 grid gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => onUseSample("glow-studio")}>
              Use sample salon
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={() => onUseSample("mehta-family-clinic")}>
              Use sample clinic
            </Button>
          </div>
        </div>
        <div className="flex gap-3 rounded-2xl p-5 text-[13.5px] text-fg-3 ring-1 ring-line">
          <Mic className="mt-0.5 size-4 shrink-0" />
          Voice notes will work once Reppy is on WhatsApp. For now, type what you&apos;d say.
        </div>
      </aside>
    </div>
  );
}
