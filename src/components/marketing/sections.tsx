"use client";
import { AnimatePresence, motion } from "framer-motion";
import {
  BellRing,
  Brain,
  Check,
  FileText,
  Globe,
  Image as ImageIcon,
  IndianRupee,
  Languages,
  Mic,
  PhoneMissed,
  ShieldCheck,
  Sunrise,
} from "lucide-react";
import { useEffect, useState } from "react";
import { ButtonLink } from "@/components/ui/button";
import { Segmented } from "@/components/ui/controls";
import { Logo } from "@/components/ui/logo";
import { cn } from "@/lib/utils";
import { Orb } from "./orb";

export function SectionHead({ title, children, center }: { title: React.ReactNode; children?: React.ReactNode; center?: boolean }) {
  return (
    <div className={cn("mb-12 max-w-2xl", center && "mx-auto text-center")}>
      <h2 className="display text-[clamp(2.4rem,4.6vw,3.9rem)]">{title}</h2>
      {children && <p className="mt-5 text-[17px] leading-relaxed text-fg-2">{children}</p>}
    </div>
  );
}

/* ─────────── Industries + languages strip (instead of borrowed logos) ─────────── */
export function MadeFor() {
  const items = ["Salons", "Clinics", "Restaurants", "Gyms", "Coaching", "Real estate", "Repair shops"];
  return (
    <section className="border-y border-line bg-ink-900/40">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-10 gap-y-4 px-5 py-7 md:px-8">
        <span className="text-[14px] text-fg-3">Adapts to any small business</span>
        <ul className="flex flex-wrap gap-x-8 gap-y-2 text-[17px] text-fg-2">
          {items.map((i) => (
            <li key={i} className="display text-[22px]">
              {i}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ─────────── Features ─────────── */
function SetupVisual() {
  const sources = [
    { icon: Globe, label: "glowstudio.in" },
    { icon: ImageIcon, label: "Rate card photo" },
    { icon: FileText, label: "Bridal packages.pdf" },
    { icon: Mic, label: "Voice note, 0:48" },
  ];
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setStep((s) => (s + 1) % 6), 1100);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="grid items-center gap-4 sm:grid-cols-[1fr_auto_1.2fr]">
      <ul className="space-y-2">
        {sources.map((s, i) => (
          <li
            key={s.label}
            className={cn(
              "flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] ring-1 transition-all duration-500",
              step > i ? "bg-white/[0.05] text-fg ring-line-strong" : "text-fg-3 ring-line",
            )}
          >
            <s.icon className="size-4" /> {s.label}
          </li>
        ))}
      </ul>
      <div className="hidden h-px w-10 bg-gradient-to-r from-line-strong to-violet-400 sm:block" />
      <div className="rounded-2xl bg-ink-800 p-4 ring-1 ring-violet-500/30">
        <div className="text-[12px] text-fg-3">Here&apos;s what Reppy knows</div>
        <div className="display mt-1 text-[24px]">Glow Studio</div>
        <ul className="mt-3 space-y-1.5 text-[13px]">
          {[
            ["Services", "9 found"],
            ["Prices", "₹400 – ₹5,500"],
            ["Hours", "Closed Tuesdays"],
            ["Staff", "Anita, Rahul, Meera"],
          ].map(([k, v], i) => (
            <li key={k} className="flex h-5 items-center justify-between">
              {step > i + 1 ? (
                <>
                  <span className="text-fg-3">{k}</span>
                  <span>{v}</span>
                </>
              ) : (
                // Not read yet: a placeholder bar instead of faded text
                <span aria-hidden className="h-2 w-full animate-pulse-soft rounded-full bg-white/[0.06]" />
              )}
            </li>
          ))}
          <li className="flex h-5 items-center justify-between text-saffron-400">
            {step > 4 && (
              <>
                <span>Missing</span>
                <span>Parking info</span>
              </>
            )}
          </li>
        </ul>
      </div>
    </div>
  );
}

function OwnerVisual() {
  return (
    <div className="mx-auto w-full max-w-sm space-y-2 rounded-2xl bg-[#0f1a17] p-4 text-[13.5px] ring-1 ring-line">
      <div className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-[#1f4d43] px-3 py-2">Closed on Diwali. Dr. Mehta off Friday.</div>
      <div className="w-fit max-w-[90%] rounded-2xl rounded-bl-md bg-[#1c2522] px-3 py-2 leading-relaxed">
        Two changes: closed Sun 8 Nov, Dr. Mehta off Fri 13 Nov. 3 patients are booked with him that day.
        <span className="mt-1 block font-medium text-teal-400">Reply YES to confirm.</span>
      </div>
      <div className="ml-auto w-fit rounded-2xl rounded-br-md bg-[#1f4d43] px-3 py-2">YES</div>
      <div className="w-fit max-w-[90%] rounded-2xl rounded-bl-md bg-[#1c2522] px-3 py-2">Done ✅ I&apos;ll help the 3 patients rebook. Tap to undo.</div>
    </div>
  );
}

export function Features() {
  const small = [
    { icon: Languages, title: "Speaks like your customers", body: "English, Hindi and the Hinglish people actually type. Replies in whatever language the customer starts in." },
    { icon: PhoneMissed, title: "Missed calls become bookings", body: "When a call is missed, Reppy follows up on WhatsApp within a minute — only for customers who've opted in." },
    { icon: IndianRupee, title: "Free UPI deposits", body: "Sends a UPI link or QR for your own UPI ID. No payment gateway, no cut taken." },
    { icon: Brain, title: "Learns what it didn't know", body: "“Let me confirm.” Reppy asks you once on WhatsApp, saves the answer, and never asks again." },
    { icon: Sunrise, title: "A report every evening", body: "Chats, bookings, recovered calls, top questions and estimated revenue, straight to your WhatsApp." },
    { icon: BellRing, title: "Reminders that cut no-shows", body: "Approved WhatsApp reminders 24 hours and 2 hours before every appointment." },
  ];
  return (
    <section id="features" className="relative scroll-mt-20 py-24 md:py-28">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <SectionHead title={<>Built for how Indian businesses actually run</>}>
          Most AI receptionists are English-only and phone-only. Reppy lives where your customers already are — WhatsApp — and picks up the phone too, with one shared memory.
        </SectionHead>

        <div className="grid gap-px overflow-hidden rounded-[28px] bg-line ring-1 ring-line lg:grid-cols-2">
          <div className="bg-ink-900 p-7 md:p-10">
            <h3 className="text-[22px] font-medium tracking-tight">Ready in under 2 minutes</h3>
            <p className="mt-2 max-w-md text-[15px] text-fg-2">
              Share your website, a photo of your rate card, a PDF or just a voice note. Reppy pulls out services, prices, timings and staff, then shows you what&apos;s missing before going live.
            </p>
            <div className="mt-8">
              <SetupVisual />
            </div>
          </div>
          <div className="bg-ink-900 p-7 md:p-10">
            <h3 className="text-[22px] font-medium tracking-tight">Update it by WhatsApp</h3>
            <p className="mt-2 max-w-md text-[15px] text-fg-2">
              No dashboard needed for day-to-day changes. Message or voice-note Reppy from a verified number. Big changes need a YES, and everything can be undone.
            </p>
            <div className="mt-8">
              <OwnerVisual />
            </div>
          </div>
        </div>

        <div className="mt-16 grid gap-x-12 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {small.map((f) => (
            <div key={f.title} className="border-t border-line pt-6">
              <f.icon className="size-5 text-violet-300" strokeWidth={1.75} />
              <h3 className="mt-4 text-[17px] font-medium">{f.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-fg-2">{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────── How it works (a real sequence, so numbered) ─────────── */
export function HowItWorks() {
  const steps = [
    { title: "Share what you already have", body: "Website link, Google Maps or Instagram screenshots, a rate card photo, a PDF, or a voice note describing your business." },
    { title: "Check what Reppy learned", body: "One page: “Here's what Reppy knows.” Fix a price, fill a gap, add custom questions like “ask for car model”." },
    { title: "Go live on WhatsApp", body: "Connect your WhatsApp Business number. Reppy starts answering, booking and sending you a report every evening." },
  ];
  return (
    <section id="how" className="relative scroll-mt-20 border-t border-line py-24 md:py-28">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <SectionHead title="From rate card to receptionist in three steps" />
        <ol className="grid gap-10 md:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s.title} className="relative">
              <span className="display block text-[88px] leading-none text-violet-500/40">{i + 1}</span>
              <h3 className="mt-3 text-[19px] font-medium">{s.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-fg-2">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ─────────── Industries ─────────── */
const industries = {
  Salon: {
    chat: [
      ["c", "Bridal trial ka price?"],
      ["r", "Bridal trial ₹4,500 hai, 2 ghante. Saree draping included hai. Kab aana chahengi?"],
    ],
    handles: ["Stylist-specific slots", "Deposits for long services", "Package and add-on questions"],
    custom: "Ask: hair length (short / medium / long)",
  },
  Clinic: {
    chat: [
      ["c", "Is Dr. Iyer available Saturday?"],
      ["r", "Dr. Iyer sees patients Saturday 10 to 1. 11:20 is free. Shall I book it? I can't give medical advice, but I can get you in."],
    ],
    handles: ["Doctor-wise schedules", "No medical advice, ever", "Emergency → call 112 + alert you"],
    custom: "Ask: new or returning patient",
  },
  Restaurant: {
    chat: [
      ["c", "Table for 6 tonight at 9?"],
      ["r", "Yes! 9:00 pm for 6 is available in the main hall. Any occasion I should note?"],
    ],
    handles: ["Table bookings", "Menu and veg/Jain questions", "Large-party deposits"],
    custom: "Ask: indoor or outdoor seating",
  },
  Gym: {
    chat: [
      ["c", "Trial class milega?"],
      ["r", "Haan, ek free trial hai. Kal 7 am HIIT ya 6 pm strength — kaunsa?"],
    ],
    handles: ["Free trial bookings", "Membership plans", "Class schedules and trainers"],
    custom: "Ask: fitness goal",
  },
  "Real estate": {
    chat: [
      ["c", "2BHK in Baner under 90L?"],
      ["r", "We have 3 options in Baner between ₹78L and ₹88L. Want to book a site visit this weekend?"],
    ],
    handles: ["Site visit scheduling", "Budget and location qualification", "Hand-off to the right agent"],
    custom: "Ask: budget range and possession timeline",
  },
  "Repair shop": {
    chat: [
      ["c", "Car service kitne ka hai? Swift hai"],
      ["r", "Swift ki general service ₹3,800 se start hai, 4–5 ghante. Pick-up chahiye?"],
    ],
    handles: ["Service estimates from your price list", "Pick-up and drop slots", "Status updates"],
    custom: "Ask: car model and year",
  },
} as const;

export function Industries() {
  const [k, setK] = useState<keyof typeof industries>("Salon");
  const ind = industries[k];
  return (
    <section id="industries" className="relative scroll-mt-20 border-t border-line py-24 md:py-28">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <SectionHead title="One brain, any business">
          Reppy detects your business type and applies a ready template. If nothing fits, start generic and add your own questions.
        </SectionHead>
        <Segmented className="mb-10 max-w-full overflow-x-auto" value={k} onChange={setK} options={Object.keys(industries).map((x) => ({ value: x as keyof typeof industries, label: x }))} />
        <AnimatePresence mode="wait">
          <motion.div key={k} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="grid gap-10 lg:grid-cols-[1.2fr_1fr]">
            <div className="space-y-3 rounded-[24px] bg-ink-900 p-6 ring-1 ring-line md:p-8">
              {ind.chat.map(([who, t], i) => (
                <div key={i} className={cn("flex", who === "c" ? "justify-end" : "justify-start")}>
                  <div className={cn("max-w-[80%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed", who === "c" ? "rounded-br-md bg-[#1f4d43]" : "rounded-bl-md bg-ink-700")}>
                    {who === "r" && <div className="mb-0.5 text-[11.5px] font-medium text-violet-300">Reppy</div>}
                    {t}
                  </div>
                </div>
              ))}
            </div>
            <div>
              <h3 className="text-[15px] text-fg-3">For a {k.toLowerCase()}, Reppy handles</h3>
              <ul className="mt-4 space-y-3">
                {ind.handles.map((h) => (
                  <li key={h} className="flex items-center gap-3 text-[17px]">
                    <Check className="size-4 text-teal-400" /> {h}
                  </li>
                ))}
              </ul>
              <div className="mt-8 rounded-2xl border border-dashed border-line-strong p-4 text-[14px] text-fg-2">
                <span className="text-fg-3">Custom field example: </span>
                {ind.custom}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

/* ─────────── Daily report showcase ─────────── */
export function ReportShowcase() {
  const rows = [
    ["Conversations", "46"],
    ["Booked by Reppy", "17"],
    ["Missed calls recovered", "4"],
    ["Est. revenue booked*", "₹29,600"],
  ];
  return (
    <section className="relative overflow-hidden border-t border-line py-24 md:py-28">
      <div className="pointer-events-none absolute top-1/2 right-[-10%] size-[600px] -translate-y-1/2 rounded-full bg-violet-600/15 blur-3xl" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-16 px-5 md:px-8 lg:grid-cols-2">
        <div>
          <SectionHead title="Know how the day went, before you close the shutter">
            Every evening Reppy sends one WhatsApp message with what happened, who still needs a reply, and what customers asked most. The full picture lives in your dashboard.
          </SectionHead>
          <ul className="-mt-4 space-y-3 text-[15px] text-fg-2">
            <li className="flex gap-3">
              <Check className="mt-1 size-4 shrink-0 text-teal-400" /> Ask anytime: “How many bookings today?” or “Who called and didn&apos;t book?”
            </li>
            <li className="flex gap-3">
              <Check className="mt-1 size-4 shrink-0 text-teal-400" /> Revenue is always labelled an estimate: booked services × your prices.
            </li>
          </ul>
          <ButtonLink href="/dashboard/analytics" variant="secondary" className="mt-9">
            Open sample analytics
          </ButtonLink>
        </div>

        <div className="mx-auto w-full max-w-[360px] rounded-[44px] border border-line-strong bg-ink-900 p-3 shadow-[0_40px_120px_-30px_rgb(139_123_255/0.55)]">
          <div className="overflow-hidden rounded-[34px] bg-[#0f1a17]">
            <div className="flex items-center gap-3 bg-[#13241f] px-5 pt-6 pb-3">
              <span className="grid size-9 place-items-center rounded-full bg-ink-900 text-[12px] font-semibold text-violet-300">R</span>
              <div className="leading-tight">
                <div className="text-[14px] font-medium">Reppy · Glow Studio</div>
                <div className="text-[11.5px] text-fg-3">Today, 9:30 pm</div>
              </div>
            </div>
            <div className="space-y-2 px-3 py-4 text-[13.5px]">
              <div className="rounded-2xl rounded-tl-md bg-[#1c2522] p-3.5 leading-relaxed">
                <div className="font-medium">Your day at Glow Studio 🌙</div>
                <dl className="mt-2 space-y-1">
                  {rows.map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-3">
                      <dt className="text-fg-2">{k}</dt>
                      <dd className="font-medium tabular-nums">{v}</dd>
                    </div>
                  ))}
                </dl>
                <div className="mt-3 border-t border-white/10 pt-2 text-fg-2">
                  Top question: haircut prices (14×)
                  <br />
                  Needs you: Sameer wants a call back
                  <br />
                  New answer saved: saree draping is included
                </div>
                <div className="mt-2 text-[11px] text-fg-3">*Estimate from booked services</div>
              </div>
              <div className="ml-auto w-fit rounded-2xl rounded-br-md bg-[#1f4d43] px-3 py-2">Who called and didn&apos;t book?</div>
              <div className="w-fit max-w-[90%] rounded-2xl rounded-bl-md bg-[#1c2522] px-3 py-2">2 people: Arjun (asked blow-dry price) and Imran (missed call, opted out of messages).</div>
            </div>
          </div>
          <p className="mt-4 text-center text-[12.5px] text-fg-3">Example report with sample data</p>
        </div>
      </div>
    </section>
  );
}

/* ─────────── Pricing ─────────── */
export function Pricing() {
  const [yearly, setYearly] = useState<"monthly" | "yearly">("monthly");
  const plans = [
    { name: "Starter", price: 999, desc: "For a single chair or a solo doctor.", convos: "100 conversations / month", features: ["WhatsApp receptionist", "English, Hindi, Hinglish", "Bookings and reminders", "UPI deposit links", "Daily WhatsApp report"] },
    { name: "Growth", price: 2499, desc: "For busy salons and clinics with a team.", convos: "500 conversations / month", features: ["Everything in Starter", "Up to 8 staff calendars", "Missed-call follow-up", "Google Calendar sync", "Learns from unanswered questions"], featured: true },
    { name: "Pro", price: 5999, desc: "For multi-location or high-volume businesses.", convos: "2,000 conversations / month", features: ["Everything in Growth", "Phone receptionist (when live)", "Multiple locations", "Priority support on WhatsApp", "Custom templates and fields"] },
  ];
  const price = (p: number) => (yearly === "yearly" ? Math.round((p * 10) / 12) : p);
  return (
    <section id="pricing" className="relative scroll-mt-20 border-t border-line py-24 md:py-28">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHead title="Costs less than a part-time receptionist">
            Every plan has a hard usage cap, so your bill can never run away. Calls count as conversations once voice launches.
          </SectionHead>
          <Segmented
            className="mb-14"
            value={yearly}
            onChange={setYearly}
            options={[
              { value: "monthly", label: "Monthly" },
              { value: "yearly", label: "Yearly · 2 months free" },
            ]}
          />
        </div>
        <div className="grid gap-px overflow-hidden rounded-[28px] bg-line ring-1 ring-line lg:grid-cols-3">
          {plans.map((p) => (
            <div key={p.name} className={cn("relative flex flex-col bg-ink-900 p-8", p.featured && "bg-[linear-gradient(180deg,rgb(139_123_255/0.14),transparent_55%),var(--color-ink-900)]")}>
              <div className="flex items-center justify-between">
                <h3 className="text-[18px] font-medium">{p.name}</h3>
                {p.featured && <span className="rounded-full bg-violet-500/20 px-2.5 py-0.5 text-[12px] text-violet-300">Most popular</span>}
              </div>
              <p className="mt-1 text-[14px] text-fg-3">{p.desc}</p>
              <div className="mt-7 flex items-baseline gap-1.5">
                <span className="display text-[56px]">₹{price(p.price).toLocaleString("en-IN")}</span>
                <span className="text-[14px] text-fg-3">/ month</span>
              </div>
              <div className="mt-1 text-[13px] text-fg-3">{yearly === "yearly" ? `Billed ₹${(p.price * 10).toLocaleString("en-IN")} yearly` : "Billed monthly, plus GST"}</div>
              <div className="mt-6 rounded-xl bg-white/[0.03] px-3.5 py-2.5 text-[14px] ring-1 ring-line">{p.convos}</div>
              <ul className="mt-6 flex-1 space-y-2.5 text-[14.5px] text-fg-2">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2.5">
                    <Check className="mt-0.5 size-4 shrink-0 text-teal-400" /> {f}
                  </li>
                ))}
              </ul>
              <ButtonLink href="/setup" variant={p.featured ? "primary" : "secondary"} className="mt-8 w-full">
                Try it free
              </ButtonLink>
            </div>
          ))}
        </div>
        <p className="mt-6 text-center text-[13px] text-fg-3">Free while Reppy is in early access; these prices are a preview. WhatsApp conversation fees from Meta are passed through at cost.</p>
      </div>
    </section>
  );
}

/* ─────────── Trust ─────────── */
export function Trust() {
  const rules = [
    { t: "Always says it's an AI", d: "Every new conversation starts with it." },
    { t: "Never invents prices", d: "Only what's in your business brain. Otherwise: “Let me confirm.”" },
    { t: "Can't be talked into discounts", d: "Customer messages are information, not instructions." },
    { t: "No medical advice", d: "Clinics: emergencies get the 112 number and an instant alert to you." },
    { t: "STOP means stop", d: "Opt-outs are honoured instantly. WhatsApp rules followed." },
    { t: "DPDP-ready", d: "Minimal data, consent first, delete on request." },
  ];
  return (
    <section className="border-t border-line py-24">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <div className="grid gap-12 lg:grid-cols-[1fr_2fr]">
          <div>
            <ShieldCheck className="size-8 text-teal-400" strokeWidth={1.5} />
            <h2 className="display mt-5 text-[40px]">Rules Reppy won&apos;t break</h2>
            <p className="mt-3 text-[15px] text-fg-2">Your reputation is on every message. These are built in and tested before every release.</p>
          </div>
          <dl className="grid gap-x-10 gap-y-7 sm:grid-cols-2">
            {rules.map((r) => (
              <div key={r.t} className="border-l border-line pl-5">
                <dt className="text-[16px] font-medium">{r.t}</dt>
                <dd className="mt-1 text-[14px] text-fg-3">{r.d}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

/* ─────────── Final CTA + footer ─────────── */
export function FinalCta() {
  return (
    <section className="relative overflow-hidden border-t border-line py-32">
      <div className="pointer-events-none absolute inset-0 grid place-items-center opacity-60">
        <Orb size={520} />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-ink-950/50" />
      <div className="relative mx-auto max-w-3xl px-5 text-center">
        <h2 className="display text-[clamp(2.8rem,6vw,5rem)]">Let Reppy pick up.</h2>
        <p className="mx-auto mt-5 max-w-lg text-[17px] text-fg-2">Send a photo of your rate card and be answering customers on WhatsApp in minutes.</p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/setup" size="lg" variant="light">
            Set up your business
          </ButtonLink>
          <ButtonLink href="#demo" size="lg" variant="secondary">
            Try the demo
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-6 px-5 py-10 text-[13.5px] text-fg-3 md:px-8">
        <Logo />
        <nav aria-label="Footer" className="flex flex-wrap gap-6">
          <a href="#features" className="hover:text-fg">Features</a>
          <a href="#pricing" className="hover:text-fg">Pricing</a>
          <a href="/dashboard/settings" className="hover:text-fg">Privacy</a>
          <a href="mailto:hello@reppy.ai" className="hover:text-fg">hello@reppy.ai</a>
        </nav>
        <span>© 2026 Reppy AI. Made in India.</span>
      </div>
    </footer>
  );
}
