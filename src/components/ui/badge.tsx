import { cn } from "@/lib/utils";

export type Tone = "neutral" | "violet" | "good" | "warn" | "bad" | "whatsapp" | "saffron";

const tones: Record<Tone, string> = {
  neutral: "bg-white/[0.06] text-fg-2 ring-white/10",
  violet: "bg-violet-500/12 text-violet-300 ring-violet-500/25",
  good: "bg-teal-500/12 text-teal-400 ring-teal-500/25",
  warn: "bg-saffron-500/12 text-saffron-400 ring-saffron-500/25",
  bad: "bg-bad/12 text-bad ring-bad/25",
  whatsapp: "bg-teal-500/12 text-teal-400 ring-teal-500/25",
  saffron: "bg-saffron-500/12 text-saffron-400 ring-saffron-500/25",
};

export function Badge({
  tone = "neutral",
  dot,
  className,
  children,
}: {
  tone?: Tone;
  dot?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[12px] font-medium ring-1 ring-inset whitespace-nowrap",
        tones[tone],
        className,
      )}
    >
      {dot && <span className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}
