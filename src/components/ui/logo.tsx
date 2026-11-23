import Link from "next/link";
import { cn } from "@/lib/utils";

/** Reppy mark: a speech bubble whose tail is a sound wave. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-7", className)} aria-hidden>
      <defs>
        <linearGradient id="rp-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#c4baff" />
          <stop offset="0.55" stopColor="#8b7bff" />
          <stop offset="1" stopColor="#e8934a" />
        </linearGradient>
      </defs>
      <path d="M16 3C8.8 3 3 8.4 3 15c0 3.2 1.4 6.1 3.6 8.3L5.5 29l6.1-2.7c1.4.4 2.9.7 4.4.7 7.2 0 13-5.4 13-12S23.2 3 16 3Z" fill="url(#rp-g)" />
      <g stroke="#0c0b1f" strokeWidth="2.2" strokeLinecap="round">
        <path d="M10.5 13v4" />
        <path d="M14.2 10.5v9" />
        <path d="M17.9 12v6" />
        <path d="M21.6 14v2" />
      </g>
    </svg>
  );
}

export function Logo({ href = "/", className }: { href?: string; className?: string }) {
  return (
    <Link href={href} className={cn("flex items-center gap-2.5", className)} aria-label="Reppy AI home">
      <LogoMark />
      <span className="text-[17px] font-semibold tracking-tight">
        Reppy<span className="text-fg-3 font-normal"> AI</span>
      </span>
    </Link>
  );
}
