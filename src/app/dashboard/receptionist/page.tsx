"use client";
import { Play, Square } from "lucide-react";
import { useEffect, useState } from "react";
import { Panel, PageHeader } from "@/components/dashboard/shell";
import { Button } from "@/components/ui/button";
import { Field, Input, Segmented, Select, Textarea, Toggle } from "@/components/ui/controls";
import { LogoMark } from "@/components/ui/logo";
import { useToast } from "@/components/ui/toast";
import { useData } from "@/lib/dashboard/context";
import type { Language, ReceptionistConfig } from "@/lib/types";
import { cn } from "@/lib/utils";

const voices = [
  { id: "Aisha · Indian English, warm", lang: "en-IN", pitch: 1.05, rate: 1 },
  { id: "Kavya · Hindi, friendly", lang: "hi-IN", pitch: 1.1, rate: 0.95 },
  { id: "Dev · Indian English, calm", lang: "en-IN", pitch: 0.85, rate: 0.95 },
];

const greetings: Record<ReceptionistConfig["personality"], (biz: string, name: string) => string> = {
  Warm: (b, n) => `Hi, thanks for reaching ${b}! I'm ${n}, the studio's AI assistant. How can I help you today?`,
  Crisp: (b, n) => `Hello, ${b}. I'm ${n}, an AI assistant. Want to book, or have a question?`,
  Formal: (b, n) => `Good day, and thank you for contacting ${b}. I am ${n}, an AI assistant. How may I assist you?`,
};

export default function ReceptionistPage() {
  const { getBusiness, getReceptionistConfig } = useData();
  const biz = getBusiness();
  const toast = useToast();
  const [saved, setSaved] = useState<ReceptionistConfig>(getReceptionistConfig());
  const [cfg, setCfg] = useState<ReceptionistConfig>(saved);
  const [speaking, setSpeaking] = useState(false);
  const dirty = JSON.stringify(cfg) !== JSON.stringify(saved);
  const set = <K extends keyof ReceptionistConfig>(k: K, v: ReceptionistConfig[K]) => setCfg((c) => ({ ...c, [k]: v }));

  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  const preview = () => {
    const synth = window.speechSynthesis;
    if (!synth) return toast("Voice preview isn't supported in this browser");
    if (speaking) {
      synth.cancel();
      setSpeaking(false);
      return;
    }
    const v = voices.find((x) => x.id === cfg.voice) ?? voices[0];
    const u = new SpeechSynthesisUtterance(cfg.greeting);
    u.lang = v.lang;
    u.pitch = v.pitch;
    u.rate = v.rate;
    const match = synth.getVoices().find((x) => x.lang === v.lang) ?? synth.getVoices().find((x) => x.lang.startsWith("en"));
    if (match) u.voice = match;
    u.onend = () => setSpeaking(false);
    setSpeaking(true);
    synth.speak(u);
  };

  const toggleLang = (l: Language) =>
    set("languages", cfg.languages.includes(l) ? cfg.languages.filter((x) => x !== l) : [...cfg.languages, l]);

  return (
    <>
      <PageHeader
        title="AI Receptionist"
        description="How Reppy sounds and behaves. Prices, timings and services come from the Knowledge Base — Reppy never makes them up."
        actions={
          <>
            {dirty && (
              <Button variant="ghost" onClick={() => setCfg(saved)}>
                Discard
              </Button>
            )}
            <Button
              disabled={!dirty}
              onClick={() => {
                setSaved(cfg);
                toast("Changes saved. Reppy is using them from the next message.");
              }}
            >
              Save changes
            </Button>
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <Panel title="Identity">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Receptionist name">
                <Input value={cfg.name} onChange={(e) => set("name", e.target.value)} />
              </Field>
              <Field label="Voice for calls" hint="Used in the phone phase. Preview uses your browser's built-in voice.">
                <div className="flex gap-2">
                  <Select value={cfg.voice} onChange={(e) => set("voice", e.target.value)}>
                    {voices.map((v) => (
                      <option key={v.id}>{v.id}</option>
                    ))}
                  </Select>
                  <Button type="button" variant="secondary" className="h-[42px] w-[42px] shrink-0 !rounded-xl !px-0" onClick={preview} aria-label={speaking ? "Stop preview" : "Play preview"}>
                    {speaking ? <Square className="size-3.5" /> : <Play className="size-4" />}
                  </Button>
                </div>
              </Field>
            </div>
            <div className="mt-5">
              <div className="mb-1.5 text-[13px] font-medium text-fg-2">Personality</div>
              <Segmented
                value={cfg.personality}
                onChange={(p) => setCfg((c) => ({ ...c, personality: p, greeting: greetings[p](biz.name, c.name) }))}
                options={[
                  { value: "Warm", label: "Warm" },
                  { value: "Crisp", label: "Crisp" },
                  { value: "Formal", label: "Formal" },
                ]}
              />
            </div>
            <div className="mt-5">
              <Field label="Greeting" hint="Reppy always says it's an AI assistant in the first message.">
                <Textarea rows={3} value={cfg.greeting} onChange={(e) => set("greeting", e.target.value)} />
              </Field>
            </div>
          </Panel>

          <Panel title="Languages">
            <p className="mb-4 text-[13.5px] text-fg-3">Reppy replies in the customer&apos;s language, including mixed Hindi-English. More Indian languages are coming.</p>
            <div className="flex flex-wrap gap-2">
              {(["English", "Hindi", "Hinglish"] as Language[]).map((l) => (
                <button
                  key={l}
                  onClick={() => toggleLang(l)}
                  aria-pressed={cfg.languages.includes(l)}
                  className={cn(
                    "rounded-full px-4 py-2 text-[13.5px] ring-1 transition-colors",
                    cfg.languages.includes(l) ? "bg-violet-500/15 text-fg ring-violet-500/40" : "text-fg-3 ring-line hover:text-fg-2",
                  )}
                >
                  {l === "Hindi" ? <span className="font-deva">हिन्दी</span> : l}
                </button>
              ))}
              {["Marathi", "Tamil", "Bengali"].map((l) => (
                <span key={l} className="rounded-full px-4 py-2 text-[13.5px] text-fg-3 ring-1 ring-dashed ring-line">
                  {l} · soon
                </span>
              ))}
            </div>
          </Panel>

          <Panel title="When to bring you in">
            <div className="divide-y divide-line">
              <Toggle checked={cfg.escalation.upset} onChange={(v) => set("escalation", { ...cfg.escalation, upset: v })} label="Customer sounds upset" description="Reppy apologises once and alerts you on WhatsApp right away." />
              <Toggle checked={cfg.escalation.asksForHuman} onChange={(v) => set("escalation", { ...cfg.escalation, asksForHuman: v })} label="Customer asks for a person" />
              <Toggle checked={cfg.escalation.emergency} onChange={(v) => set("escalation", { ...cfg.escalation, emergency: v })} label="Emergency is mentioned" description="Reppy tells them to call 112 and alerts you. It never gives medical advice." />
              <Toggle checked={cfg.escalation.refund} onChange={(v) => set("escalation", { ...cfg.escalation, refund: v })} label="Refunds or discounts" description="Reppy never promises money back or discounts on its own." />
            </div>
          </Panel>

          <Panel title="Booking and follow-up">
            <div className="divide-y divide-line">
              <Toggle checked={cfg.missedCallFollowUp} onChange={(v) => set("missedCallFollowUp", v)} label="WhatsApp follow-up after a missed call" description="Only to customers who haven't opted out, using an approved WhatsApp template." />
              <Toggle checked={cfg.depositForNewCustomers} onChange={(v) => set("depositForNewCustomers", v)} label="Ask new customers for a UPI deposit" description={`Sends a UPI link to ${biz.upiId}. You confirm when the money arrives.`} />
            </div>
            <div className="mt-4">
              <Field label="Extra instructions" hint="Plain English. Customers can't change these, however they ask.">
                <Textarea rows={4} value={cfg.instructions} onChange={(e) => set("instructions", e.target.value)} />
              </Field>
            </div>
          </Panel>
        </div>

        {/* Live preview */}
        <div className="xl:sticky xl:top-24 xl:self-start">
          <div className="rounded-[32px] border border-line-strong bg-ink-900 p-3 shadow-[0_30px_80px_-30px_rgb(139_123_255/0.45)]">
            <div className="overflow-hidden rounded-[24px] bg-[#0f1a17]">
              <div className="flex items-center gap-3 bg-[#13241f] px-4 py-3">
                <span className="grid size-9 place-items-center rounded-full bg-ink-900">
                  <LogoMark className="size-6" />
                </span>
                <div className="leading-tight">
                  <div className="text-[14px] font-medium">{biz.name}</div>
                  <div className="text-[11.5px] text-teal-400">AI assistant · usually replies instantly</div>
                </div>
              </div>
              <div className="space-y-2 bg-[radial-gradient(circle_at_20%_10%,rgb(37_160_141/0.08),transparent_50%)] px-3 py-5 text-[13.5px]">
                <div className="ml-auto w-fit max-w-[80%] rounded-2xl rounded-br-md bg-[#1f4d43] px-3 py-2">Hi, kal haircut ho sakta hai?</div>
                <div className="w-fit max-w-[85%] rounded-2xl rounded-bl-md bg-[#1c2522] px-3 py-2 leading-relaxed">{cfg.greeting}</div>
                <div className="w-fit max-w-[85%] rounded-2xl rounded-bl-md bg-[#1c2522] px-3 py-2 leading-relaxed">
                  {cfg.personality === "Formal"
                    ? "Certainly. Tomorrow we have availability at 11:00 and 16:30. A women's haircut is ₹700."
                    : "Haan bilkul! Kal 11:00 ya 4:30 free hai. Women's haircut ₹700 hai. Kaunsa time chalega?"}
                </div>
              </div>
            </div>
          </div>
          <p className="mt-3 text-center text-[12.5px] text-fg-3">Preview of how {cfg.name} opens a WhatsApp chat</p>
        </div>
      </div>
    </>
  );
}
