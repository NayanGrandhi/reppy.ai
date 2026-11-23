import { MessageCircle, Phone, PhoneMissed } from "lucide-react";
import { Badge, type Tone } from "@/components/ui/badge";
import type { AppointmentStatus, Channel, ConversationStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export const statusMeta: Record<ConversationStatus, { label: string; tone: Tone }> = {
  booked: { label: "Booked", tone: "violet" },
  answered: { label: "Answered", tone: "neutral" },
  handoff: { label: "Needs you", tone: "warn" },
  recovered: { label: "Missed call recovered", tone: "good" },
  missed: { label: "Missed", tone: "bad" },
  live: { label: "Live now", tone: "good" },
};

export function StatusBadge({ status }: { status: ConversationStatus }) {
  const m = statusMeta[status];
  return (
    <Badge tone={m.tone} dot>
      {m.label}
    </Badge>
  );
}

export const apptMeta: Record<AppointmentStatus, { label: string; tone: Tone }> = {
  confirmed: { label: "Confirmed", tone: "violet" },
  "awaiting-deposit": { label: "Awaiting deposit", tone: "warn" },
  completed: { label: "Completed", tone: "good" },
  cancelled: { label: "Cancelled", tone: "neutral" },
  "no-show": { label: "No-show", tone: "bad" },
};

export function ChannelIcon({ channel, missed, className }: { channel: Channel; missed?: boolean; className?: string }) {
  const Icon = channel === "whatsapp" ? MessageCircle : missed ? PhoneMissed : Phone;
  return (
    <span
      className={cn(
        "inline-grid size-7 shrink-0 place-items-center rounded-full ring-1",
        channel === "whatsapp" ? "bg-teal-500/10 text-teal-400 ring-teal-500/25" : "bg-violet-500/10 text-violet-300 ring-violet-500/25",
        className,
      )}
      title={channel === "whatsapp" ? "WhatsApp" : "Phone call"}
    >
      <Icon className="size-3.5" strokeWidth={2} />
    </span>
  );
}

export function Delta({ value, suffix = "%" }: { value: number; suffix?: string }) {
  const up = value >= 0;
  return (
    <span className={cn("text-[12px] font-medium tabular-nums", up ? "text-teal-400" : "text-bad")}>
      {up ? "▲" : "▼"} {Math.abs(value)}
      {suffix}
    </span>
  );
}
