import { cn, initials } from "@/lib/utils";

// Hue is derived from the name so a person keeps the same colour everywhere.
const hues = ["#8b7bff", "#25a08d", "#cc7d35", "#d2629e", "#5b8def", "#a597ff"];

export function Avatar({ name, size = 32, className }: { name: string; size?: number; className?: string }) {
  const h = hues[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % hues.length];
  return (
    <span
      aria-hidden
      className={cn("inline-grid shrink-0 place-items-center rounded-full font-semibold text-white", className)}
      style={{ width: size, height: size, fontSize: size * 0.36, background: `color-mix(in oklab, ${h} 55%, #161429)`, boxShadow: `inset 0 0 0 1px ${h}55` }}
    >
      {initials(name)}
    </span>
  );
}
