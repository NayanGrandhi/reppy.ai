"use client";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, CalendarCheck2, IndianRupee, MessageCircle, Phone, PhoneOff, Play, RotateCcw, Sparkles, Volume2, VolumeX } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/ui/logo";
import { scenarios, type DemoStep } from "@/lib/demo-scripts";
import { cn } from "@/lib/utils";
import { Orb, Waveform } from "./orb";

type Phase = "idle" | "running" | "done";

const actionIcon = { booking: CalendarCheck2, upi: IndianRupee, brain: BookOpen, handoff: Phone };

export function InteractiveDemo() {
  const [sid, setSid] = useState(scenarios[0].id);
  const scenario = scenarios.find((s) => s.id === sid)!;
  const [phase, setPhase] = useState<Phase>("idle");
  const [shown, setShown] = useState<DemoStep[]>([]);
  const [sound, setSound] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const timers = useRef<number[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const clear = () => {
    timers.current.forEach((t) => clearTimeout(t));
    timers.current = [];
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
  };

  const reset = useCallback(() => {
    clear();
    setShown([]);
    setPhase("idle");
    setSeconds(0);
  }, []);

  useEffect(() => reset, [reset]);
  useEffect(() => reset(), [sid, reset]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [shown]);

  useEffect(() => {
    if (phase !== "running" || scenario.channel !== "call") return;
    const t = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [phase, scenario.channel]);

  const start = () => {
    reset();
    setPhase("running");
    let acc = 0;
    scenario.steps.forEach((step, i) => {
      acc += step.wait;
      timers.current.push(
        window.setTimeout(() => {
          setShown((s) => [...s, step]);
          if (sound && step.speak && "speechSynthesis" in window) {
            const u = new SpeechSynthesisUtterance(step.text);
            u.lang = step.speak.lang;
            const v = window.speechSynthesis.getVoices().find((x) => x.lang === step.speak!.lang);
            if (v) u.voice = v;
            window.speechSynthesis.speak(u);
          }
          if (i === scenario.steps.length - 1) {
            timers.current.push(window.setTimeout(() => setPhase("done"), 1200));
          }
        }, acc),
      );
    });
  };

  const intent = [...shown].reverse().find((s) => s.intent)?.intent;
  const fields = shown.reduce<Record<string, string>>((a, s) => ({ ...a, ...s.fields }), {});
  const actions = shown.filter((s) => s.action).map((s) => s.action!);
  const last = shown[shown.length - 1];
  const reppySpeaking = phase === "running" && scenario.channel === "call" && last?.from === "reppy";

  return (
    <div className="relative">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div role="tablist" aria-label="Demo scenario" className="flex flex-wrap gap-2">
          {scenarios.map((s) => {
            const Icon = s.channel === "call" ? Phone : s.channel === "owner" ? BookOpen : MessageCircle;
            return (
              <button
                key={s.id}
                role="tab"
                aria-selected={sid === s.id}
                onClick={() => setSid(s.id)}
                className={cn(
                  "flex items-center gap-2 rounded-full px-4 py-2 text-[14px] ring-1 transition-colors",
                  sid === s.id ? "bg-white/[0.08] text-fg ring-line-strong" : "text-fg-3 ring-line hover:text-fg-2",
                )}
              >
                <Icon className="size-4" /> {s.label}
              </button>
            );
          })}
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-dashed border-saffron-500/40 px-3 py-1 text-[12.5px] text-saffron-400">
          Simulation. No real call or message is sent.
        </span>
      </div>

      <div className="grid overflow-hidden rounded-[28px] border border-line-strong bg-ink-900/80 shadow-[0_40px_120px_-40px_rgb(139_123_255/0.5)] lg:h-[680px] lg:grid-cols-[1.15fr_1fr]">
        {/* Conversation side */}
        <div className="relative flex min-h-[560px] flex-col border-line lg:min-h-0 lg:border-r">
          <div className="flex items-center gap-3 border-b border-line px-5 py-3.5">
            <span className="grid size-9 place-items-center rounded-full bg-ink-800 ring-1 ring-line">
              <LogoMark className="size-6" />
            </span>
            <div className="leading-tight">
              <div className="text-[14px] font-medium">{scenario.channel === "owner" ? "Reppy · admin chat" : scenario.business}</div>
              <div className="text-[12px] text-fg-3">
                {scenario.channel === "call" ? "Incoming call" : "WhatsApp"} · {scenario.language}
              </div>
            </div>
            {scenario.channel === "call" && (
              <button
                onClick={() => setSound((v) => !v)}
                className="ml-auto flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] text-fg-2 ring-1 ring-line hover:bg-white/5"
                aria-pressed={sound}
              >
                {sound ? <Volume2 className="size-3.5" /> : <VolumeX className="size-3.5" />}
                {sound ? "Sound on" : "Sound off"}
              </button>
            )}
          </div>

          {scenario.channel === "call" && (
            <div className="flex items-center gap-5 border-b border-line bg-[radial-gradient(ellipse_at_left,rgb(139_123_255/0.12),transparent_60%)] px-5 py-5">
              <Orb size={84} speaking={reppySpeaking} />
              <div className="min-w-0 flex-1">
                <div className="text-[13px] text-fg-3">{phase === "idle" ? "Ready" : phase === "done" ? "Call ended" : reppySpeaking ? "Reppy is speaking" : "Caller is speaking"}</div>
                <div className="text-2xl font-semibold tabular-nums">
                  {String(Math.floor(seconds / 60)).padStart(2, "0")}:{String(seconds % 60).padStart(2, "0")}
                </div>
                <Waveform bars={36} className="mt-2 h-6" active={phase === "running"} />
              </div>
            </div>
          )}

          <div ref={scrollRef} className="scroll-thin flex-1 space-y-2.5 overflow-y-auto px-5 py-5" aria-live="polite">
            {phase === "idle" && (
              <div className="grid h-full place-content-center gap-5 py-10 text-center">
                <p className="mx-auto max-w-xs text-[15px] text-fg-2">
                  {scenario.channel === "call"
                    ? "Hear how Reppy picks up a clinic call, books a slot and stays within the safety rules."
                    : scenario.channel === "owner"
                      ? "See how an owner changes prices and staff days with a single voice note."
                      : "Watch a customer book a keratin treatment in Hinglish, with a UPI deposit."}
                </p>
                <Button onClick={start} size="lg" className="mx-auto">
                  {scenario.channel === "call" ? <Phone className="size-4" /> : <Play className="size-4" />}
                  {scenario.channel === "call" ? "Start simulated call" : "Play conversation"}
                </Button>
              </div>
            )}
            <AnimatePresence initial={false}>
              {shown.map((m, i) => {
                const mine = scenario.channel === "owner" ? m.from === "owner" : m.from === "customer";
                return (
                  <motion.div
                    key={`${sid}-${i}`}
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.25 }}
                    className={cn("flex", mine ? "justify-end" : "justify-start")}
                  >
                    <div
                      className={cn(
                        "max-w-[82%] whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-[14px] leading-relaxed",
                        mine ? "rounded-br-md bg-[#1f4d43] text-fg" : "rounded-bl-md bg-ink-700 text-fg",
                        scenario.channel === "call" && mine && "bg-white/[0.07]",
                      )}
                    >
                      <div className={cn("mb-0.5 text-[11.5px] font-medium", m.from === "reppy" ? "text-violet-300" : "text-fg-3")}>
                        {m.from === "reppy" ? "Reppy" : m.from === "owner" ? "Priya (owner)" : "Customer"}
                      </div>
                      {m.text}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            {phase === "running" && last && (
              <div className="flex gap-1 px-2 pt-1" aria-hidden>
                {[0, 1, 2].map((i) => (
                  <span key={i} className="size-1.5 animate-pulse-soft rounded-full bg-fg-3" style={{ animationDelay: `${i * 200}ms` }} />
                ))}
              </div>
            )}
          </div>

          {phase !== "idle" && (
            <div className="flex items-center justify-between border-t border-line px-5 py-3">
              <span className="text-[12.5px] text-fg-3">{phase === "done" ? "Conversation complete" : "Playing…"}</span>
              <Button size="sm" variant="secondary" onClick={phase === "done" ? start : reset}>
                {phase === "done" ? <RotateCcw className="size-3.5" /> : <PhoneOff className="size-3.5" />}
                {phase === "done" ? "Play again" : "Stop"}
              </Button>
            </div>
          )}
        </div>

        {/* Brain side */}
        <div className="scroll-thin flex min-h-0 flex-col gap-5 overflow-y-auto bg-ink-950/40 p-5 md:p-6">
          <div className="flex items-center gap-2 text-[13px] text-fg-3">
            <Sparkles className="size-4 text-violet-300" /> What Reppy understands, live
          </div>

          <section>
            <h4 className="mb-2 text-[12.5px] text-fg-3">Intent</h4>
            <AnimatePresence mode="wait">
              <motion.div key={intent ?? "none"} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                {intent ? (
                  <span className="inline-flex items-center gap-2 rounded-full bg-violet-500/15 px-3 py-1.5 text-[14px] text-violet-300 ring-1 ring-violet-500/30">
                    <span className="size-1.5 rounded-full bg-current" /> {intent}
                  </span>
                ) : (
                  <span className="text-[14px] text-fg-3">Listening…</span>
                )}
              </motion.div>
            </AnimatePresence>
          </section>

          <section>
            <h4 className="mb-2 text-[12.5px] text-fg-3">Details captured</h4>
            <dl className="divide-y divide-line rounded-2xl ring-1 ring-line">
              {Object.keys(fields).length === 0 && <div className="px-4 py-3 text-[13.5px] text-fg-3">Nothing yet</div>}
              {Object.entries(fields).map(([k, v]) => (
                <motion.div key={k} layout initial={{ opacity: 0, backgroundColor: "rgba(139,123,255,0.15)" }} animate={{ opacity: 1, backgroundColor: "rgba(139,123,255,0)" }} transition={{ duration: 1 }} className="flex justify-between gap-4 px-4 py-2.5 text-[13.5px]">
                  <dt className="text-fg-3">{k}</dt>
                  <dd className="text-right text-fg">{v}</dd>
                </motion.div>
              ))}
            </dl>
          </section>

          <section className="space-y-2">
            <AnimatePresence>
              {actions.map((a) => {
                const Icon = actionIcon[a.kind];
                return (
                  <motion.div
                    key={a.title}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "flex gap-3 rounded-2xl p-4 ring-1",
                      a.kind === "upi" ? "bg-saffron-500/[0.07] ring-saffron-500/25" : "bg-teal-500/[0.07] ring-teal-500/25",
                    )}
                  >
                    <Icon className={cn("mt-0.5 size-5 shrink-0", a.kind === "upi" ? "text-saffron-400" : "text-teal-400")} />
                    <div>
                      <div className="text-[14px] font-medium">{a.title}</div>
                      {a.lines.map((l) => (
                        <div key={l} className="text-[13px] text-fg-2">
                          {l}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </section>

          <AnimatePresence>
            {phase === "done" && (
              <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-auto rounded-2xl bg-white/[0.03] p-4 ring-1 ring-line">
                <h4 className="mb-1.5 text-[12.5px] text-fg-3">Summary sent to the owner</h4>
                <p className="text-[14px] leading-relaxed text-fg-2">{scenario.summary}</p>
              </motion.section>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
