"use client";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Reppy's "voice orb": layered gradients that slowly rotate.
 * When `speaking` is true it breathes and a ring of sound bars appears.
 */
export function Orb({ speaking = false, size = 360, className }: { speaking?: boolean; size?: number; className?: string }) {
  return (
    <div className={cn("relative isolate grid place-items-center", className)} style={{ width: size, height: size }} aria-hidden>
      {/* outer glow */}
      <div className="absolute inset-[-18%] -z-10 rounded-full bg-[radial-gradient(circle,rgb(139_123_255/0.35),rgb(232_147_74/0.08)_45%,transparent_70%)] blur-2xl" />
      {/* orbit rings */}
      <div className="absolute inset-[-6%] rounded-full border border-violet-400/15" />
      <div className="absolute inset-[-14%] rounded-full border border-dashed border-violet-400/10 animate-orb-spin" />
      <motion.div
        className="relative size-full overflow-hidden rounded-full"
        animate={speaking ? { scale: [1, 1.035, 0.99, 1.03, 1] } : { scale: [1, 1.012, 1] }}
        transition={{ duration: speaking ? 1.6 : 6, repeat: Infinity, ease: "easeInOut" }}
      >
        <div
          className="absolute inset-[-25%] animate-orb-spin"
          style={{
            background:
              "conic-gradient(from 180deg at 50% 50%, #2a1f7a, #8b7bff, #f2ab6a, #6f5cf0, #1b1650, #c4baff, #2a1f7a)",
            filter: "blur(28px)",
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_32%_28%,rgb(255_255_255/0.55),transparent_32%)] mix-blend-overlay" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgb(8_7_26/0.65),transparent_55%)]" />
        <div className="absolute inset-0 rounded-full shadow-[inset_0_0_60px_rgb(8_7_26/0.6),inset_0_-10px_40px_rgb(232_147_74/0.25)]" />
        {/* fine contour lines, a nod to the NextLevel reference */}
        <svg viewBox="0 0 200 200" className="absolute inset-0 size-full opacity-25 mix-blend-overlay animate-orb-spin [animation-duration:60s]">
          {Array.from({ length: 14 }, (_, i) => (
            <ellipse key={i} cx="100" cy="100" rx={96 - i * 2} ry={30 + i * 4.6} fill="none" stroke="white" strokeWidth="0.35" transform={`rotate(${i * 9} 100 100)`} />
          ))}
        </svg>
      </motion.div>
      {speaking && (
        <div className="absolute inset-0 grid place-items-center">
          <Waveform bars={7} className="h-10" light />
        </div>
      )}
    </div>
  );
}

export function Waveform({ bars = 24, className, light, active = true }: { bars?: number; className?: string; light?: boolean; active?: boolean }) {
  return (
    <div className={cn("flex items-center gap-[3px]", className)} aria-hidden>
      {Array.from({ length: bars }, (_, i) => (
        <span
          key={i}
          className={cn("w-[3px] origin-center rounded-full", light ? "bg-white/90" : "bg-violet-400", active ? "animate-wave" : "scale-y-[0.2]")}
          style={{ height: "100%", animationDelay: `${(i * 137) % 900}ms`, animationDuration: `${900 + ((i * 89) % 600)}ms` }}
        />
      ))}
    </div>
  );
}
