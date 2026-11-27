"use client";
import { AlertTriangle, CheckCircle2, FileText, Globe, Image as ImageIcon, Mic, Plus, Undo2, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { addFaq, answerGap, updateService } from "@/app/dashboard/actions";
import { Panel, PageHeader } from "@/components/dashboard/shell";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Input, Segmented, Textarea } from "@/components/ui/controls";
import { useToast } from "@/components/ui/toast";
import { useData } from "@/lib/dashboard/context";
import type { ChangeLogEntry, Faq, KnowledgeGap, Service } from "@/lib/types";
import { cn, formatINR, formatTime, relativeDay } from "@/lib/utils";

type Tab = "summary" | "services" | "faqs" | "gaps" | "log";

export default function KnowledgePage() {
  const { DEMO_TODAY, getBusiness, getChangeLog, getFaqs, getKnowledgeGaps, getServices, getStaff, live } = useData();
  const toast = useToast();
  const biz = getBusiness();
  const [tab, setTab] = useState<Tab>("summary");
  const [services, setServices] = useState<Service[]>(getServices());
  const [faqs, setFaqs] = useState<Faq[]>(getFaqs());
  const [gaps, setGaps] = useState<KnowledgeGap[]>(getKnowledgeGaps());
  // After a save the server sends fresh data; show it.
  const serverServices = getServices();
  const serverFaqs = getFaqs();
  const serverGaps = getKnowledgeGaps();
  useEffect(() => setServices(serverServices), [serverServices]);
  useEffect(() => setFaqs(serverFaqs), [serverFaqs]);
  useEffect(() => setGaps(serverGaps), [serverGaps]);
  const [log, setLog] = useState<ChangeLogEntry[]>(getChangeLog());
  const waiting = gaps.filter((g) => g.status === "waiting");

  const addLog = (description: string) =>
    setLog((l) => [{ id: `cl_${Date.now()}`, businessId: biz.id, at: `${DEMO_TODAY}T19:48:00`, by: biz.owner || "You", via: "Dashboard", description }, ...l]);

  return (
    <>
      <PageHeader
        title="Knowledge Base"
        description="Everything Reppy is allowed to tell customers. Update it here, or just message Reppy on WhatsApp: “Haircut is now 400”."
        actions={
          <ButtonLink variant="secondary" href="/setup">
            <Upload className="size-4" /> Add a source
          </ButtonLink>
        }
      />
      <Segmented
        className="mb-6 max-w-full overflow-x-auto"
        value={tab}
        onChange={setTab}
        options={[
          { value: "summary", label: "What Reppy knows" },
          { value: "services", label: "Services & prices" },
          { value: "faqs", label: "Policies & FAQs" },
          { value: "gaps", label: <>Unanswered {waiting.length > 0 && <span className="ml-1 rounded-full bg-saffron-500/20 px-1.5 text-saffron-400">{waiting.length}</span>}</> },
          { value: "log", label: "Change log" },
        ]}
      />

      {tab === "summary" && (
        <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
          <Panel>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[13px] text-fg-3">Here&apos;s what Reppy knows about</p>
                <h2 className="display mt-1 text-[40px]">{biz.name}</h2>
                <p className="mt-1 text-fg-2">
                  {biz.type} in {biz.address}
                </p>
              </div>
              <Badge tone="good" dot>
                Salon template applied
              </Badge>
            </div>
            <div className="mt-8 grid gap-8 md:grid-cols-2">
              <div>
                <h3 className="mb-3 text-[13px] font-medium text-fg-2">Opening hours</h3>
                <ul className="space-y-1.5 text-[14px]">
                  {biz.hours.map((h) => (
                    <li key={h.day} className="flex justify-between">
                      <span className="text-fg-2">{h.day}</span>
                      <span className={cn("tabular-nums", h.closed && "text-fg-3")}>{h.closed ? "Closed" : `${h.open} – ${h.close}`}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-6">
                <div>
                  <h3 className="mb-3 text-[13px] font-medium text-fg-2">Team</h3>
                  <ul className="space-y-1.5 text-[14px]">
                    {getStaff().map((s) => (
                      <li key={s.id} className="flex justify-between">
                        <span>{s.name}</span>
                        <span className="text-fg-3">{s.role}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="mb-3 text-[13px] font-medium text-fg-2">Booking rules</h3>
                  <ul className="space-y-1.5 text-[14px] text-fg-2">
                    <li>{biz.bufferMin} min buffer between appointments</li>
                    <li>Deposits by UPI to {biz.upiId}</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="mt-8 border-t border-line pt-6">
              <h3 className="mb-3 text-[13px] font-medium text-fg-2">{services.length} services</h3>
              <div className="flex flex-wrap gap-2">
                {services.map((s) => (
                  <span key={s.id} className="rounded-full bg-white/[0.04] px-3 py-1.5 text-[13px] ring-1 ring-line">
                    {s.name} <span className="text-fg-3">{formatINR(s.priceINR)}</span>
                  </span>
                ))}
              </div>
            </div>
          </Panel>

          <div className="space-y-6">
            <Panel title="Check before going live">
              <ul className="space-y-3 text-[13.5px]">
                {[
                  { ok: true, t: "Services, prices and durations" },
                  { ok: true, t: "Opening hours and closed days" },
                  { ok: true, t: "Staff and who does what" },
                  { ok: false, t: "Parking information is missing — asked 5 times" },
                  { ok: false, t: "Cancellation fee isn't clear in your rate card" },
                ].map((i) => (
                  <li key={i.t} className="flex gap-2.5">
                    {i.ok ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-teal-400" /> : <AlertTriangle className="mt-0.5 size-4 shrink-0 text-saffron-400" />}
                    <span className={i.ok ? "text-fg-2" : "text-fg"}>{i.t}</span>
                  </li>
                ))}
              </ul>
            </Panel>
            <Panel title="Sources">
              <ul className="space-y-3 text-[13.5px]">
                {[
                  { icon: Globe, t: "glowstudio.in", d: "Website, read 18 Nov" },
                  { icon: ImageIcon, t: "rate-card-nov.jpg", d: "Photo, 9 services found" },
                  { icon: FileText, t: "bridal-packages.pdf", d: "PDF, 3 pages" },
                  { icon: Mic, t: "Voice note, 0:48", d: "Hours and staff off-days" },
                ].map((s) => (
                  <li key={s.t} className="flex items-center gap-3">
                    <span className="grid size-8 place-items-center rounded-lg bg-white/[0.04] ring-1 ring-line">
                      <s.icon className="size-4 text-fg-2" />
                    </span>
                    <div>
                      <div>{s.t}</div>
                      <div className="text-[12px] text-fg-3">{s.d}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </Panel>
          </div>
        </div>
      )}

      {tab === "services" && (
        <Panel bodyClassName="p-0">
          <div className="scroll-thin overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-[14px]">
              <thead className="text-[12.5px] text-fg-3">
                <tr className="border-b border-line">
                  <th className="px-5 py-3 font-normal">Service</th>
                  <th className="px-5 py-3 font-normal">Category</th>
                  <th className="px-5 py-3 font-normal">Price (₹)</th>
                  <th className="px-5 py-3 font-normal">Duration (min)</th>
                  <th className="px-5 py-3 font-normal">Done by</th>
                </tr>
              </thead>
              <tbody>
                {services.map((s) => (
                  <tr key={s.id} className="border-b border-line/70 last:border-0">
                    <td className="px-5 py-2.5 font-medium">{s.name}</td>
                    <td className="px-5 py-2.5 text-fg-2">{s.category}</td>
                    <td className="px-5 py-2.5">
                      <Input
                        type="number"
                        aria-label={`${s.name} price`}
                        defaultValue={s.priceINR}
                        className="!w-28 !py-1.5 tabular-nums"
                        onBlur={(e) => {
                          const v = Number(e.target.value);
                          if (v && v !== s.priceINR) {
                            if (live) {
                              updateService(s.id, { priceINR: v }).then((r) => {
                                if (r.ok) {
                                  addLog(`${s.name} price ${formatINR(s.priceINR)} → ${formatINR(v)}`);
                                  setServices((all) => all.map((x) => (x.id === s.id ? { ...x, priceINR: v } : x)));
                                  toast(`${s.name} is now ${formatINR(v)}`);
                                } else toast(r.error);
                              });
                              return;
                            }
                            addLog(`${s.name} price ${formatINR(s.priceINR)} → ${formatINR(v)}`);
                            setServices((all) => all.map((x) => (x.id === s.id ? { ...x, priceINR: v } : x)));
                            toast(`${s.name} is now ${formatINR(v)}`);
                          }
                        }}
                      />
                    </td>
                    <td className="px-5 py-2.5">
                      <Input
                        type="number"
                        aria-label={`${s.name} duration`}
                        defaultValue={s.durationMin}
                        className="!w-24 !py-1.5 tabular-nums"
                        onBlur={(e) => {
                          const v = Number(e.target.value);
                          if (v && v !== s.durationMin) {
                            if (live) {
                              updateService(s.id, { durationMin: v }).then((r) => {
                                if (r.ok) {
                                  addLog(`${s.name} duration ${s.durationMin} → ${v} min`);
                                  setServices((all) => all.map((x) => (x.id === s.id ? { ...x, durationMin: v } : x)));
                                  toast(`${s.name} now takes ${v} min`);
                                } else toast(r.error);
                              });
                              return;
                            }
                            addLog(`${s.name} duration ${s.durationMin} → ${v} min`);
                            setServices((all) => all.map((x) => (x.id === s.id ? { ...x, durationMin: v } : x)));
                            toast(`${s.name} now takes ${v} min`);
                          }
                        }}
                      />
                    </td>
                    <td className="px-5 py-2.5 text-fg-2">{s.staffIds.map((id) => getStaff().find((x) => x.id === id)?.name).join(", ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      {tab === "faqs" && <FaqEditor faqs={faqs} setFaqs={setFaqs} policies={biz.policies} onLog={addLog} />}

      {tab === "gaps" && (
        <div className="space-y-4">
          <p className="max-w-2xl text-[14px] text-fg-2">
            When Reppy doesn&apos;t know something it tells the customer “let me confirm”, asks you on WhatsApp, and saves your answer here so it never has to ask twice.
          </p>
          {gaps.map((g) => (
            <GapCard
              key={g.id}
              gap={g}
              onAnswer={async (answer) => {
                if (live) {
                  const r = await answerGap(g.id, answer, g.question);
                  if (!r.ok) return toast(r.error);
                }
                setGaps((all) => all.map((x) => (x.id === g.id ? { ...x, status: "answered", answer } : x)));
                setFaqs((f) => [...f, { id: `fq_${Date.now()}`, q: g.question, a: answer }]);
                addLog(`Added FAQ: ${g.question}`);
                toast(live ? "Saved. Reppy will use this answer from now on." : `Saved. Reppy replied to ${g.askedBy.split(" ")[0]} with your answer.`);
              }}
            />
          ))}
        </div>
      )}

      {tab === "log" && (
        <Panel bodyClassName="p-0">
          <ul className="divide-y divide-line">
            {log.map((e) => (
              <li key={e.id} className={cn("flex flex-wrap items-center gap-4 px-5 py-4", e.undone && "opacity-50")}>
                <div className="min-w-0 flex-1">
                  <div className={cn("text-[14px]", e.undone && "line-through")}>{e.description}</div>
                  <div className="mt-0.5 text-[12.5px] text-fg-3">
                    {e.by} via {e.via} · {relativeDay(e.at, DEMO_TODAY)} {formatTime(e.at)}
                  </div>
                </div>
                {live ? null : e.undone ? (
                  <span className="text-[12.5px] text-fg-3">Undone</span>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setLog((l) => l.map((x) => (x.id === e.id ? { ...x, undone: true } : x)));
                      toast("Change undone");
                    }}
                  >
                    <Undo2 className="size-3.5" /> Undo
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </>
  );
}

function GapCard({ gap, onAnswer }: { gap: KnowledgeGap; onAnswer: (a: string) => void }) {
  const { DEMO_TODAY } = useData();
  const [text, setText] = useState("");
  return (
    <div className={cn("panel p-5", gap.status === "waiting" && "ring-1 ring-saffron-500/25")}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[15px] font-medium">“{gap.question}”</div>
          <div className="mt-1 text-[12.5px] text-fg-3">
            Asked by {gap.askedBy} · {relativeDay(gap.askedAt, DEMO_TODAY)} {formatTime(gap.askedAt)} · {gap.timesAsked} times in total
          </div>
        </div>
        <Badge tone={gap.status === "waiting" ? "warn" : "good"} dot>
          {gap.status === "waiting" ? "Waiting for you" : "Answered"}
        </Badge>
      </div>
      {gap.status === "answered" ? (
        <p className="mt-3 rounded-xl bg-white/[0.03] p-3 text-[14px] text-fg-2 ring-1 ring-line">{gap.answer}</p>
      ) : (
        <form
          className="mt-4 flex flex-col gap-2 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            if (text.trim()) onAnswer(text.trim());
          }}
        >
          <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type the answer once — Reppy remembers it" />
          <Button type="submit" disabled={!text.trim()}>
            Save and reply
          </Button>
        </form>
      )}
    </div>
  );
}

function FaqEditor({
  faqs,
  setFaqs,
  policies,
  onLog,
}: {
  faqs: Faq[];
  setFaqs: React.Dispatch<React.SetStateAction<Faq[]>>;
  policies: string[];
  onLog: (d: string) => void;
}) {
  const { live } = useData();
  const toast = useToast();
  const [adding, setAdding] = useState(false);
  const [q, setQ] = useState("");
  const [a, setA] = useState("");
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
      <Panel
        title={`FAQs (${faqs.length})`}
        action={
          <Button size="sm" variant="secondary" onClick={() => setAdding(true)}>
            <Plus className="size-3.5" /> Add FAQ
          </Button>
        }
      >
        {adding && (
          <form
            className="mb-5 space-y-2 rounded-2xl bg-white/[0.02] p-4 ring-1 ring-line"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!q.trim() || !a.trim()) return;
              let id = `fq_${Date.now()}`;
              if (live) {
                const r = await addFaq(q, a);
                if (!r.ok) return toast(r.error);
                id = r.id;
              }
              setFaqs((f) => [{ id, q, a }, ...f]);
              onLog(`Added FAQ: ${q}`);
              toast("FAQ added");
              setQ("");
              setA("");
              setAdding(false);
            }}
          >
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Question customers ask" autoFocus />
            <Textarea rows={2} value={a} onChange={(e) => setA(e.target.value)} placeholder="Your answer" />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setAdding(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm">
                Add FAQ
              </Button>
            </div>
          </form>
        )}
        <dl className="divide-y divide-line">
          {faqs.map((f) => (
            <div key={f.id} className="py-4 first:pt-0">
              <dt className="text-[14.5px] font-medium">{f.q}</dt>
              <dd className="mt-1 text-[14px] text-fg-2">{f.a}</dd>
            </div>
          ))}
        </dl>
      </Panel>
      <Panel title="Policies">
        <ul className="space-y-3 text-[14px] text-fg-2">
          {policies.map((p) => (
            <li key={p} className="flex gap-2.5">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-violet-400" />
              {p}
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
