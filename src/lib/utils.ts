export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
export const formatINR = (n: number) => inr.format(n);
export const formatNum = (n: number) => new Intl.NumberFormat("en-IN").format(n);

// All dates in the mock data are local wall-clock strings; format them without timezone surprises.
const parse = (iso: string) => new Date(iso.length === 10 ? `${iso}T12:00:00` : iso);

export const formatTime = (iso: string) =>
  parse(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true }).replace(" ", " ");

export const formatDate = (iso: string, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" }) =>
  parse(iso).toLocaleDateString("en-IN", opts);

export const formatDay = (iso: string) => formatDate(iso, { weekday: "short", day: "numeric", month: "short" });

export function relativeDay(iso: string, today: string) {
  const a = parse(iso.slice(0, 10)).getTime();
  const b = parse(today).getTime();
  const diff = Math.round((a - b) / 86400000);
  if (diff === 0) return "Today";
  if (diff === -1) return "Yesterday";
  if (diff === 1) return "Tomorrow";
  return formatDay(iso);
}

export function formatDuration(sec: number) {
  if (!sec) return "—";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function addDays(date: string, n: number) {
  const d = parse(date);
  d.setDate(d.getDate() + n);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export const initials = (name: string) =>
  name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
