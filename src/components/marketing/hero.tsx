"use client";
import { motion } from "framer-motion";
import { CalendarCheck2, Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ButtonLink } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { cn } from "@/lib/utils";
import { Orb } from "./orb";

const links = [
  { href: "#demo", label: "Demo" },
  { href: "#features", label: "Features" },
  { href: "#how", label: "How it works" },
  { href: "#industries", label: "Industries" },
  { href: "#pricing", label: "Pricing" },
  { href: "/chat", label: "Live chat" },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 24);
    h();
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);
  return (
    <header className={cn("fixed inset-x-0 top-0 z-50 transition-colors duration-300", scrolled && "bg-ink-950/70 backdrop-blur-xl")}>
      <div className="mx-auto flex h-18 max-w-7xl items-center gap-6 px-5 md:px-8" style={{ height: 72 }}>
        <Logo />
        <nav className="mx-auto hidden items-center rounded-full border border-line bg-white/[0.03] p-1 backdrop-blur md:flex">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="rounded-full px-4 py-1.5 text-[14px] text-fg-2 transition-colors hover:bg-white/[0.06] hover:text-fg">
              {l.label}
            </a>
          ))}
        </nav>
        <div className="ml-auto hidden items-center gap-2 md:flex md:ml-0">
          <Link href="/dashboard" className="px-3 text-[14px] text-fg-2 hover:text-fg">
            Log in
          </Link>
          <ButtonLink href="/dashboard" size="sm">
            Open dashboard
          </ButtonLink>
        </div>
        <button className="ml-auto rounded-lg p-2 md:hidden" onClick={() => setOpen(!open)} aria-label="Menu" aria-expanded={open}>
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>
      {open && (
        <div className="border-t border-line bg-ink-950/95 px-5 py-4 backdrop-blur-xl md:hidden">
          {links.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="block py-2.5 text-fg-2">
              {l.label}
            </a>
          ))}
          <ButtonLink href="/dashboard" className="mt-3 w-full">
            Open dashboard
          </ButtonLink>
        </div>
      )}
    </header>
  );
}

const greetings = [
  { text: "नमस्ते, Glow Studio!", deva: true },
  { text: "Kal 5 baje slot hai?", deva: false },
  { text: "Hi, how can I help?", deva: false },
];

export function Hero() {
  const [g, setG] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setG((x) => (x + 1) % greetings.length), 2800);
    return () => clearInterval(t);
  }, []);

  const rise = (d: number) => ({
    initial: { opacity: 0, y: 24, filter: "blur(6px)" },
    animate: { opacity: 1, y: 0, filter: "blur(0px)" },
    transition: { duration: 0.9, delay: d, ease: [0.2, 0.7, 0.2, 1] as const },
  });

  return (
    <section className="relative overflow-hidden pt-32 pb-20 md:pt-40">
      <div className="grid-bg pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[600px] w-[1100px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse,rgb(111_92_240/0.35),transparent_65%)] blur-3xl" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 md:px-8 lg:grid-cols-[1.15fr_1fr]">
        <div>
          <motion.p {...rise(0)} className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-line-strong bg-white/[0.04] py-1 pr-4 pl-1.5 text-[13px] text-fg-2">
            <span className="rounded-full bg-saffron-500/15 px-2 py-0.5 text-[12px] font-medium text-saffron-400">Made in India</span>
            English, <span className="font-deva text-[14px]">हिन्दी</span> and Hinglish
          </motion.p>
          <h1 className="display text-[clamp(3.1rem,7.4vw,6.4rem)]">
            <motion.span {...rise(0.1)} className="block">
              The receptionist
            </motion.span>
            <motion.span {...rise(0.22)} className="block text-fg-2">
              that never misses
            </motion.span>
            <motion.span {...rise(0.34)} className="block">
              a customer.
            </motion.span>
          </h1>
          <motion.p {...rise(0.5)} className="mt-7 max-w-[34rem] text-[17px] leading-relaxed text-fg-2">
            Reppy answers your WhatsApp messages and phone calls, books appointments and collects UPI deposits in your customers&apos; own language.
            Set it up in two minutes from a photo of your rate card.
          </motion.p>
          <motion.div {...rise(0.62)} className="mt-9 flex flex-wrap items-center gap-3">
            <ButtonLink href="#demo" size="lg" variant="light">
              Try the live demo
            </ButtonLink>
            <ButtonLink href="/dashboard" size="lg" variant="secondary">
              See the dashboard
            </ButtonLink>
          </motion.div>
          <motion.p {...rise(0.74)} className="mt-6 text-[13px] text-fg-3">
            14-day free trial. Works with WhatsApp Business. No card needed.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.4, delay: 0.2, ease: [0.2, 0.7, 0.2, 1] }}
          className="relative mx-auto grid place-items-center"
        >
          <Orb size={380} speaking className="max-sm:!size-[300px]" />
          {/* floating conversation fragments */}
          <motion.div
            key={g}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute -top-2 left-0 rounded-2xl rounded-bl-md border border-line-strong bg-ink-800/80 px-4 py-2.5 text-[15px] shadow-xl backdrop-blur-md sm:-left-6"
          >
            <span className={greetings[g].deva ? "font-deva text-[16px]" : ""}>{greetings[g].text}</span>
          </motion.div>
          <div className="absolute right-0 bottom-10 w-60 rounded-2xl rounded-br-md border border-violet-500/30 bg-violet-500/15 px-4 py-3 text-[14px] leading-snug shadow-xl backdrop-blur-md sm:-right-4">
            <div className="mb-1 text-[11.5px] font-medium text-violet-300">Reppy</div>
            Haan! Rahul 5:00 pe free hai. Men&apos;s haircut ₹400. Book kar dun?
          </div>
          <div className="absolute -bottom-6 left-6 flex items-center gap-2.5 rounded-full border border-teal-500/30 bg-ink-900/90 py-2 pr-4 pl-2.5 text-[13px] shadow-xl backdrop-blur">
            <span className="grid size-7 place-items-center rounded-full bg-teal-500/15 text-teal-400">
              <CalendarCheck2 className="size-4" />
            </span>
            Booked · Sat, 5:00 pm with Rahul
          </div>
        </motion.div>
      </div>

      <ProductFrame />
    </section>
  );
}

/** Hamming-style glowing frame with a miniature of the real dashboard. */
function ProductFrame() {
  const bars = [34, 42, 28, 50, 46, 62, 58, 40, 44, 36, 55, 66, 72, 60];
  return (
    <div className="relative mx-auto mt-28 max-w-6xl px-5 md:px-8">
      <div className="pointer-events-none absolute inset-x-10 -top-10 h-40 rounded-full bg-violet-500/30 blur-3xl" />
      <div className="relative rounded-t-[28px] border border-b-0 border-violet-400/40 bg-gradient-to-b from-violet-500/20 to-transparent p-2.5 pb-0 shadow-[0_-20px_80px_-20px_rgb(139_123_255/0.6)]">
        <div className="overflow-hidden rounded-t-[20px] border border-b-0 border-line-strong bg-ink-900">
          <div className="grid grid-cols-[180px_1fr] max-md:grid-cols-1">
            <div className="hidden border-r border-line p-4 md:block">
              <div className="mb-5 flex items-center gap-2 text-[13px] font-semibold">
                <span className="size-5 rounded-md bg-gradient-to-br from-violet-300 to-saffron-500" /> Reppy
              </div>
              {["Overview", "Conversations", "Appointments", "Customers", "AI Receptionist", "Analytics", "Knowledge Base"].map((l, i) => (
                <div key={l} className={cn("mb-1 rounded-lg px-2.5 py-1.5 text-[12px]", i === 0 ? "bg-violet-500/15 text-fg" : "text-fg-3")}>
                  {l}
                </div>
              ))}
            </div>
            <div className="p-5 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-fg-3">Monday, 23 November</div>
                  <div className="display text-[28px]">Good evening, Priya</div>
                </div>
                <span className="flex items-center gap-1.5 rounded-full bg-teal-500/10 px-3 py-1 text-[11.5px] text-teal-400 ring-1 ring-teal-500/30">
                  <span className="size-1.5 animate-pulse-soft rounded-full bg-current" /> Reppy is live
                </span>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-line ring-1 ring-line md:grid-cols-4">
                {[
                  ["Conversations today", "46"],
                  ["Booked by Reppy", "17"],
                  ["Missed calls recovered", "4"],
                  ["Upcoming bookings", "₹29,600"],
                ].map(([k, v]) => (
                  <div key={k} className="bg-ink-850 p-4">
                    <div className="text-[11px] text-fg-3">{k}</div>
                    <div className="mt-1 text-[22px] font-semibold tabular-nums">{v}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-[1.6fr_1fr]">
                <div className="rounded-2xl bg-ink-850 p-4 ring-1 ring-line">
                  <div className="mb-3 text-[12px] text-fg-2">Conversations by channel</div>
                  <div className="flex h-28 items-end gap-1.5">
                    {bars.map((b, i) => (
                      <div key={i} className="flex h-full flex-1 flex-col justify-end gap-[2px]">
                        <div className="rounded-t-[3px] bg-series-1" style={{ height: `${b * 0.45}%` }} />
                        <div className="rounded-b-[3px] bg-series-2" style={{ height: `${b * 0.8}%` }} />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-2 rounded-2xl bg-ink-850 p-4 ring-1 ring-line">
                  <div className="text-[12px] text-fg-2">Needs your attention</div>
                  {["Sameer asked for you", "2 questions to answer", "₹200 deposit pending"].map((t) => (
                    <div key={t} className="flex items-center gap-2 text-[12px] text-fg-3">
                      <span className="size-1.5 rounded-full bg-saffron-500" /> {t}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-ink-950 to-transparent" />
    </div>
  );
}
