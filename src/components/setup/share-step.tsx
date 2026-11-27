"use client";
import { FileText, Globe, ImagePlus, Loader2, Mic, Upload, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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
  onManual,
}: {
  status: Status | null;
  busy: boolean;
  error: string | null;
  onSubmit: (input: ShareInput) => void;
  onUseSample: (which: "glow-studio" | "mehta-family-clinic") => void;
  onManual: () => void;
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
            <ul className="mx-auto mt-6 grid max-w-lg grid-cols-3 gap-3 text-left sm:grid-cols-4">
              {files.map((f, i) => (
                <Thumb key={`${f.name}-${i}`} file={f} onRemove={() => setFiles((x) => x.filter((_, j) => j !== i))} />
              ))}
            </ul>
          )}
          {files.length > 0 && <p className="mt-3 text-[12px] text-fg-3 tabular-nums">{(total / 1024 / 1024).toFixed(1)} MB of 4 MB</p>}
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
            Reading photos needs the Claude API key. Until it&apos;s added, type your details in or start from a sample below.
          </div>
        )}
        <div className="rounded-2xl p-5 ring-1 ring-line">
          <h2 className="text-[15px] font-medium">Rather type it in?</h2>
          <p className="mt-1 text-[13.5px] text-fg-3">Fill in your services, prices, hours and team yourself. Takes about 5 minutes and works without the AI.</p>
          <Button type="button" size="sm" className="mt-4 w-full" onClick={onManual}>
            Type my details in
          </Button>
        </div>
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

function Thumb({ file, onRemove }: { file: File; onRemove: () => void }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!file.type.startsWith("image/")) return;
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);
  return (
    <li className="group relative aspect-square overflow-hidden rounded-xl bg-ink-800 ring-1 ring-line">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={file.name} className="size-full object-cover" />
      ) : (
        <div className="grid size-full place-items-center p-2 text-center">
          <FileText className="size-6 text-fg-3" />
          <span className="line-clamp-2 text-[11px] break-all text-fg-3">{file.name}</span>
        </div>
      )}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${file.name}`}
        className="absolute top-1.5 right-1.5 grid size-6 place-items-center rounded-full bg-ink-950/80 text-fg-2 opacity-90 ring-1 ring-white/10 transition hover:text-fg sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100"
      >
        <X className="size-3.5" />
      </button>
    </li>
  );
}
