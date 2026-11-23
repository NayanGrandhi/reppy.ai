"use client";
import { AlertTriangle, CheckCircle2, Loader2, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/controls";
import { BUSINESS_TYPES, type Brain, DAYS, type Missing } from "@/lib/brain/schema";
import { checkCompleteness, templates } from "@/lib/brain/templates";
import { cn } from "@/lib/utils";

type Day = (typeof DAYS)[number];

function Section({ id, title, hint, children, action }: { id: string; title: string; hint?: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section id={id} className="panel scroll-mt-24 p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[17px] font-medium">{title}</h2>
          {hint && <p className="mt-0.5 text-[13.5px] text-fg-3">{hint}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

const small = "!py-2 text-[13.5px]";

export function ReviewStep({
  brain,
  setBrain,
  missing,
  warnings,
  saving,
  error,
  onSave,
  onBack,
}: {
  brain: Brain;
  setBrain: (b: Brain) => void;
  missing: Missing[];
  warnings: string[];
  saving: boolean;
  error: string | null;
  onSave: () => void;
  onBack: () => void;
}) {
  const set = <K extends keyof Brain>(k: K, v: Brain[K]) => setBrain({ ...brain, [k]: v });
  const checks = checkCompleteness(brain);
  // Don't repeat what our own checks already list.
  const aiMissing = missing.filter((m) => !checks.some((c) => c.toLowerCase().includes(m.field.toLowerCase()) || m.field.toLowerCase().includes(c.toLowerCase())));
  const staffWord = templates[brain.type].staffWord;

  const hourFor = (day: Day) => brain.hours.find((h) => h.day === day);
  const setHour = (day: Day, patch: Partial<Brain["hours"][number]>) => {
    const existing = hourFor(day) ?? { day, open: "10:00", close: "19:00", closed: false };
    const next = { ...existing, ...patch };
    const others = brain.hours.filter((h) => h.day !== day);
    set("hours", [...others, next].sort((a, b) => DAYS.indexOf(a.day) - DAYS.indexOf(b.day)));
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
      <div className="space-y-6">
        {warnings.length > 0 && (
          <div className="rounded-2xl bg-saffron-500/[0.08] p-4 text-[13.5px] text-fg-2 ring-1 ring-saffron-500/25">
            {warnings.map((w) => (
              <p key={w}>{w}</p>
            ))}
          </div>
        )}

        <Section id="basics" title="Basics">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Business name">
              <Input value={brain.name} onChange={(e) => set("name", e.target.value)} />
            </Field>
            <Field label="Type" hint={`Template: ${brain.type}. Changes which questions Reppy asks.`}>
              <Select value={brain.type} onChange={(e) => set("type", e.target.value as Brain["type"])}>
                {BUSINESS_TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </Select>
            </Field>
            <div className="md:col-span-2">
              <Field label="What you do, in one line">
                <Input value={brain.description} onChange={(e) => set("description", e.target.value)} />
              </Field>
            </div>
            <div className="md:col-span-2">
              <Field label="Address">
                <Input value={brain.address} onChange={(e) => set("address", e.target.value)} />
              </Field>
            </div>
            <Field label="City">
              <Input value={brain.city} onChange={(e) => set("city", e.target.value)} />
            </Field>
            <Field label="Phone">
              <Input value={brain.phone} onChange={(e) => set("phone", e.target.value)} />
            </Field>
            <Field label="UPI ID for deposits" hint="Optional. Money goes straight to you.">
              <Input value={brain.upiId} onChange={(e) => set("upiId", e.target.value)} placeholder="yourname@okhdfcbank" />
            </Field>
            <Field label="Languages" hint="Comma separated">
              <Input value={brain.languages.join(", ")} onChange={(e) => set("languages", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))} />
            </Field>
          </div>
        </Section>

        <Section
          id="services"
          title={`Services (${brain.services.length})`}
          hint="Leave a price empty if it varies, and say why in the note. Reppy never guesses."
          action={
            <Button size="sm" variant="secondary" onClick={() => set("services", [...brain.services, { name: "", category: "", priceINR: null, priceNote: "", durationMin: null, staff: [] }])}>
              <Plus className="size-3.5" /> Add service
            </Button>
          }
        >
          {brain.services.length === 0 ? (
            <p className="text-[14px] text-fg-3">No services yet. Add the ones customers ask about most.</p>
          ) : (
            <div className="scroll-thin -mx-2 overflow-x-auto px-2">
              <table className="w-full min-w-[720px] text-left text-[13px]">
                <thead className="text-fg-3">
                  <tr>
                    <th className="pb-2 font-normal">Service</th>
                    <th className="pb-2 font-normal">Category</th>
                    <th className="pb-2 font-normal">Price ₹</th>
                    <th className="pb-2 font-normal">Price note</th>
                    <th className="pb-2 font-normal">Minutes</th>
                    <th className="pb-2 font-normal capitalize">{staffWord}s</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {brain.services.map((s, i) => {
                    const upd = (patch: Partial<typeof s>) => set("services", brain.services.map((x, j) => (j === i ? { ...x, ...patch } : x)));
                    return (
                      <tr key={i} className="align-top">
                        <td className="py-1 pr-2">
                          <Input aria-label="Service name" value={s.name} onChange={(e) => upd({ name: e.target.value })} className={small} />
                        </td>
                        <td className="py-1 pr-2">
                          <Input aria-label="Category" value={s.category} onChange={(e) => upd({ category: e.target.value })} className={cn(small, "!w-28")} />
                        </td>
                        <td className="py-1 pr-2">
                          <Input
                            aria-label="Price"
                            type="number"
                            min={0}
                            value={s.priceINR ?? ""}
                            onChange={(e) => upd({ priceINR: e.target.value === "" ? null : Number(e.target.value) })}
                            className={cn(small, "!w-24 tabular-nums", s.priceINR === null && !s.priceNote && "ring-saffron-500/50")}
                          />
                        </td>
                        <td className="py-1 pr-2">
                          <Input aria-label="Price note" value={s.priceNote} onChange={(e) => upd({ priceNote: e.target.value })} className={small} placeholder="starts at…" />
                        </td>
                        <td className="py-1 pr-2">
                          <Input
                            aria-label="Duration in minutes"
                            type="number"
                            min={0}
                            value={s.durationMin ?? ""}
                            onChange={(e) => upd({ durationMin: e.target.value === "" ? null : Number(e.target.value) })}
                            className={cn(small, "!w-20 tabular-nums", s.durationMin === null && "ring-saffron-500/50")}
                          />
                        </td>
                        <td className="py-1 pr-2">
                          <Input aria-label="Who does it" value={s.staff.join(", ")} onChange={(e) => upd({ staff: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) })} className={small} />
                        </td>
                        <td className="py-1">
                          <button onClick={() => set("services", brain.services.filter((_, j) => j !== i))} aria-label={`Remove ${s.name || "service"}`} className="mt-1.5 rounded-lg p-1.5 text-fg-3 hover:bg-white/5 hover:text-bad">
                            <Trash2 className="size-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Section>

        <Section id="hours" title="Opening hours" hint="Days marked 'not set' make Reppy say it will confirm.">
          <ul className="divide-y divide-line">
            {DAYS.map((day) => {
              const h = hourFor(day);
              return (
                <li key={day} className="flex flex-wrap items-center gap-3 py-2.5">
                  <span className="w-28 text-[14px]">{day}</span>
                  {!h ? (
                    <>
                      <Badge tone="warn">Not set</Badge>
                      <Button size="sm" variant="ghost" onClick={() => setHour(day, {})}>
                        Add hours
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setHour(day, { closed: true, open: "", close: "" })}>
                        Mark closed
                      </Button>
                    </>
                  ) : h.closed ? (
                    <>
                      <span className="text-[14px] text-fg-3">Closed</span>
                      <Button size="sm" variant="ghost" onClick={() => setHour(day, { closed: false, open: "10:00", close: "19:00" })}>
                        Open this day
                      </Button>
                    </>
                  ) : (
                    <>
                      <Input aria-label={`${day} opens`} type="time" value={h.open} onChange={(e) => setHour(day, { open: e.target.value })} className={cn(small, "!w-32")} />
                      <span className="text-fg-3">to</span>
                      <Input aria-label={`${day} closes`} type="time" value={h.close} onChange={(e) => setHour(day, { close: e.target.value })} className={cn(small, "!w-32")} />
                      <Button size="sm" variant="ghost" onClick={() => setHour(day, { closed: true, open: "", close: "" })}>
                        Closed
                      </Button>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        </Section>

        <Section
          id="staff"
          title={`Team (${brain.staff.length})`}
          action={
            <Button size="sm" variant="secondary" onClick={() => set("staff", [...brain.staff, { name: "", role: "", offDays: [] }])}>
              <Plus className="size-3.5" /> Add person
            </Button>
          }
        >
          {brain.staff.length === 0 && <p className="text-[14px] text-fg-3">Add your team so customers can ask for someone by name.</p>}
          <ul className="space-y-4">
            {brain.staff.map((p, i) => {
              const upd = (patch: Partial<typeof p>) => set("staff", brain.staff.map((x, j) => (j === i ? { ...x, ...patch } : x)));
              return (
                <li key={i} className="rounded-2xl p-4 ring-1 ring-line">
                  <div className="flex gap-2">
                    <Input aria-label="Name" value={p.name} onChange={(e) => upd({ name: e.target.value })} placeholder="Name" className={small} />
                    <Input aria-label="Role" value={p.role} onChange={(e) => upd({ role: e.target.value })} placeholder="Role" className={small} />
                    <button onClick={() => set("staff", brain.staff.filter((_, j) => j !== i))} aria-label={`Remove ${p.name || "person"}`} className="rounded-lg p-2 text-fg-3 hover:bg-white/5 hover:text-bad">
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    <span className="mr-1 text-[12.5px] text-fg-3">Days off</span>
                    {DAYS.map((d) => {
                      const on = p.offDays.includes(d);
                      return (
                        <button
                          key={d}
                          aria-pressed={on}
                          onClick={() => upd({ offDays: on ? p.offDays.filter((x) => x !== d) : [...p.offDays, d] })}
                          className={cn("rounded-full px-2.5 py-1 text-[12px] ring-1", on ? "bg-saffron-500/15 text-saffron-400 ring-saffron-500/30" : "text-fg-3 ring-line hover:text-fg-2")}
                        >
                          {d.slice(0, 3)}
                        </button>
                      );
                    })}
                  </div>
                </li>
              );
            })}
          </ul>
        </Section>

        <Section id="policies" title="Policies and booking rules">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Gap between appointments (minutes)">
              <Input type="number" min={0} value={brain.bookingRules.bufferMin ?? ""} onChange={(e) => set("bookingRules", { ...brain.bookingRules, bufferMin: e.target.value === "" ? null : Number(e.target.value) })} />
            </Field>
            <Field label="Booking deposit (₹)" hint="Leave empty if you don't take deposits.">
              <Input type="number" min={0} value={brain.bookingRules.depositINR ?? ""} onChange={(e) => set("bookingRules", { ...brain.bookingRules, depositINR: e.target.value === "" ? null : Number(e.target.value) })} />
            </Field>
            <div className="md:col-span-2">
              <Field label="Policies" hint="One per line: cancellation, late arrival, payment methods…">
                <Textarea rows={4} value={brain.policies.join("\n")} onChange={(e) => set("policies", e.target.value.split("\n").filter((l) => l.trim()))} />
              </Field>
            </div>
            <div className="md:col-span-2">
              <Field label="Questions Reppy asks before booking" hint="One per line, e.g. 'Car model and year'.">
                <Textarea rows={2} value={brain.customFields.map((c) => c.label).join("\n")} onChange={(e) => set("customFields", e.target.value.split("\n").filter((l) => l.trim()).map((label) => ({ label })))} />
              </Field>
            </div>
          </div>
        </Section>

        <Section
          id="faqs"
          title={`FAQs (${brain.faqs.length})`}
          action={
            <Button size="sm" variant="secondary" onClick={() => set("faqs", [...brain.faqs, { q: "", a: "" }])}>
              <Plus className="size-3.5" /> Add FAQ
            </Button>
          }
        >
          {brain.faqs.length === 0 && <p className="text-[14px] text-fg-3">Parking, walk-ins, brands you use… Reppy will also learn these from customers.</p>}
          <ul className="space-y-3">
            {brain.faqs.map((f, i) => {
              const upd = (patch: Partial<typeof f>) => set("faqs", brain.faqs.map((x, j) => (j === i ? { ...x, ...patch } : x)));
              return (
                <li key={i} className="flex gap-2">
                  <div className="flex-1 space-y-2">
                    <Input aria-label="Question" value={f.q} onChange={(e) => upd({ q: e.target.value })} placeholder="Question" className={small} />
                    <Textarea aria-label="Answer" rows={2} value={f.a} onChange={(e) => upd({ a: e.target.value })} placeholder="Answer" className={small} />
                  </div>
                  <button onClick={() => set("faqs", brain.faqs.filter((_, j) => j !== i))} aria-label="Remove FAQ" className="self-start rounded-lg p-2 text-fg-3 hover:bg-white/5 hover:text-bad">
                    <Trash2 className="size-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        </Section>
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="panel p-5">
          <h2 className="text-[15px] font-medium">Before going live</h2>
          {checks.length === 0 && aiMissing.length === 0 ? (
            <p className="mt-3 flex gap-2 text-[13.5px] text-teal-400">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0" /> Everything important is filled in.
            </p>
          ) : (
            <ul className="mt-3 space-y-2.5 text-[13.5px]">
              {checks.map((c) => (
                <li key={c} className="flex gap-2">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-saffron-400" />
                  <span>{c}</span>
                </li>
              ))}
              {aiMissing.map((m) => (
                <li key={m.field} className="flex gap-2">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-saffron-400" />
                  <span>
                    {m.field}
                    <span className="block text-[12.5px] text-fg-3">{m.why}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-4 text-[12.5px] text-fg-3">You can save with gaps. Reppy will say “let me confirm” for anything missing.</p>
          <div className="mt-5 grid gap-2">
            <Button onClick={onSave} disabled={saving || !brain.name.trim()}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : null}
              Save and chat with Reppy
            </Button>
            <Button variant="ghost" onClick={onBack} disabled={saving}>
              Start over
            </Button>
          </div>
          {error && <p className="mt-3 text-[13px] text-bad">{error}</p>}
        </div>
        <nav className="mt-4 hidden flex-wrap gap-x-4 gap-y-1 px-1 text-[13px] text-fg-3 lg:flex">
          {["basics", "services", "hours", "staff", "policies", "faqs"].map((s) => (
            <a key={s} href={`#${s}`} className="capitalize hover:text-fg">
              {s}
            </a>
          ))}
        </nav>
      </aside>
    </div>
  );
}

