"use client";
import { ArrowLeft, Mic, Search, Send, Sparkles } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { ChannelIcon, StatusBadge, statusMeta } from "@/components/dashboard/bits";
import { PageHeader } from "@/components/dashboard/shell";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Segmented, Select } from "@/components/ui/controls";
import { useToast } from "@/components/ui/toast";
import { useData } from "@/lib/dashboard/context";
import type { Conversation, ConversationStatus } from "@/lib/types";
import { cn, formatDate, formatDuration, formatTime, relativeDay } from "@/lib/utils";

function ConversationsInner() {
  const { DEMO_TODAY, customerById, getConversations, live } = useData();
  const params = useSearchParams();
  const toast = useToast();
  const [items, setItems] = useState<Conversation[]>(getConversations());
  const [channel, setChannel] = useState<"all" | "whatsapp" | "call">("all");
  const [status, setStatus] = useState<"all" | ConversationStatus>("all");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<string | null>(params.get("id") ?? items[0]?.id ?? null);
  const [mobileDetail, setMobileDetail] = useState(Boolean(params.get("id")));
  const [draft, setDraft] = useState("");

  // Follow links from search and notifications while already on this page.
  useEffect(() => {
    const id = params.get("id");
    if (id) {
      setSelected(id);
      setMobileDetail(true);
    }
  }, [params]);

  const filtered = useMemo(
    () =>
      items.filter((c) => {
        const cu = customerById(c.customerId);
        return (
          (channel === "all" || c.channel === channel) &&
          (status === "all" || c.status === status) &&
          (!q || cu?.name.toLowerCase().includes(q.toLowerCase()) || c.summary.toLowerCase().includes(q.toLowerCase()))
        );
      }),
    [items, channel, status, q],
  );

  const current = items.find((c) => c.id === selected) ?? null;
  const cu = current ? customerById(current.customerId) : null;

  const send = () => {
    if (!draft.trim() || !current) return;
    setItems((all) =>
      all.map((c) =>
        c.id === current.id
          ? { ...c, status: c.status === "handoff" ? "answered" : c.status, messages: [...c.messages, { from: "owner", text: draft.trim(), at: `${DEMO_TODAY}T19:48:00` }] }
          : c,
      ),
    );
    setDraft("");
    toast(`Sent to ${cu?.name} on WhatsApp (simulated)`);
  };

  return (
    <>
      <PageHeader
        title="Conversations"
        description={live ? "Chats Reppy handled for your business in the last 30 days." : "Every WhatsApp chat and phone call Reppy handled, with transcripts and AI summaries."}
      />
      <div className="panel grid min-h-[640px] overflow-hidden lg:grid-cols-[380px_1fr]">
        {/* List */}
        <div className={cn("flex flex-col border-line lg:border-r", mobileDetail && "hidden lg:flex")}>
          <div className="space-y-3 border-b border-line p-4">
            <label className="relative block">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-fg-3" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by name or topic"
                className="h-9 w-full rounded-full bg-white/[0.04] pr-3 pl-9 text-[13px] ring-1 ring-line outline-none placeholder:text-fg-3 focus:ring-violet-500/50"
              />
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <Segmented
                size="sm"
                value={channel}
                onChange={setChannel}
                options={[
                  { value: "all", label: "All" },
                  { value: "whatsapp", label: "WhatsApp" },
                  { value: "call", label: "Calls" },
                ]}
              />
              <Select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className="min-w-[8rem] flex-1 !py-1.5 text-[12.5px]" aria-label="Filter by status">
                <option value="all">Any status</option>
                {Object.entries(statusMeta).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <ul className="scroll-thin flex-1 overflow-y-auto">
            {filtered.length === 0 && <li className="p-8 text-center text-sm text-fg-3">No conversations match these filters.</li>}
            {filtered.map((c) => {
              const p = customerById(c.customerId)!;
              const active = c.id === selected;
              return (
                <li key={c.id}>
                  <button
                    onClick={() => {
                      setSelected(c.id);
                      setMobileDetail(true);
                    }}
                    className={cn("flex w-full gap-3 border-b border-line px-4 py-3.5 text-left transition-colors", active ? "bg-violet-500/[0.08]" : "hover:bg-white/[0.02]")}
                  >
                    <ChannelIcon channel={c.channel} missed={c.channel === "call" && c.durationSec === 0} className="mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-[14px] font-medium">{p.name}</span>
                        <span className="shrink-0 text-[12px] text-fg-3">
                          {relativeDay(c.startedAt, DEMO_TODAY) === "Today" ? formatTime(c.startedAt) : relativeDay(c.startedAt, DEMO_TODAY)}
                        </span>
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-[13px] text-fg-3">{c.summary}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <StatusBadge status={c.status} />
                        <span className="text-[12px] text-fg-3">{c.intent}</span>
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Detail */}
        {current && cu ? (
          <div className={cn("flex min-w-0 flex-col xl:flex-row", !mobileDetail && "hidden lg:flex")}>
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex items-center gap-3 border-b border-line px-5 py-4">
                <button onClick={() => setMobileDetail(false)} className="rounded-lg p-1.5 text-fg-2 hover:bg-white/5 lg:hidden" aria-label="Back to list">
                  <ArrowLeft className="size-4" />
                </button>
                <Avatar name={cu.name} size={36} />
                <div className="min-w-0">
                  <div className="font-medium">{cu.name}</div>
                  <div className="text-[12.5px] text-fg-3">
                    {cu.phone} · {current.channel === "whatsapp" ? "WhatsApp" : "Phone call"} · {relativeDay(current.startedAt, DEMO_TODAY)} {formatTime(current.startedAt)}
                  </div>
                </div>
                <div className="ml-auto">
                  <StatusBadge status={current.status} />
                </div>
              </div>

              <div className="scroll-thin flex-1 space-y-3 overflow-y-auto bg-[radial-gradient(ellipse_at_top,rgb(139_123_255/0.05),transparent_60%)] px-5 py-6">
                {current.messages.length === 0 && (
                  <p className="py-16 text-center text-sm text-fg-3">No transcript. {current.summary}</p>
                )}
                {current.channel === "call" && current.durationSec > 0 && (
                  <div className="mx-auto mb-2 flex w-fit items-center gap-2 rounded-full bg-white/[0.04] px-3 py-1 text-[12px] text-fg-3 ring-1 ring-line">
                    <Mic className="size-3.5" /> Call transcript · {formatDuration(current.durationSec)} · recording off
                  </div>
                )}
                {current.messages.map((m, i) => (
                  <div key={i} className={cn("flex", m.from === "customer" ? "justify-start" : "justify-end")}>
                    <div
                      className={cn(
                        "max-w-[78%] rounded-2xl px-3.5 py-2.5 text-[14px] leading-relaxed",
                        m.from === "customer" && "rounded-bl-md bg-ink-700 text-fg",
                        m.from === "reppy" && "rounded-br-md bg-violet-500/15 text-fg ring-1 ring-violet-500/20",
                        m.from === "owner" && "rounded-br-md bg-saffron-500/12 text-fg ring-1 ring-saffron-500/25",
                      )}
                    >
                      {m.from !== "customer" && (
                        <div className={cn("mb-0.5 text-[11.5px] font-medium", m.from === "reppy" ? "text-violet-300" : "text-saffron-400")}>
                          {m.from === "reppy" ? "Reppy" : "You (to Reppy)"}
                        </div>
                      )}
                      {m.text}
                      <div className="mt-1 text-right text-[11px] text-fg-3">{formatTime(m.at)}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-line p-3">
                {live ? (
                  <p className="px-2 py-1.5 text-[13px] text-fg-3">These are website chats. Replying yourself works once WhatsApp is connected.</p>
                ) : current.channel === "whatsapp" ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      send();
                    }}
                    className="flex items-center gap-2"
                  >
                    <input
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      placeholder={`Reply to ${cu.name.split(" ")[0]} yourself — Reppy pauses while you type`}
                      className="h-10 flex-1 rounded-full bg-white/[0.04] px-4 text-[13.5px] ring-1 ring-line outline-none placeholder:text-fg-3 focus:ring-violet-500/50"
                    />
                    <Button type="submit" size="sm" className="h-10 w-10 !px-0" aria-label="Send">
                      <Send className="size-4" />
                    </Button>
                  </form>
                ) : (
                  <p className="px-2 py-1.5 text-[13px] text-fg-3">Phone calls are read-only. Call {cu.name.split(" ")[0]} back on {cu.phone}.</p>
                )}
              </div>
            </div>

            <aside aria-label="Conversation details" className="w-full shrink-0 space-y-5 border-t border-line p-5 xl:w-72 xl:border-t-0 xl:border-l">
              <div>
                <div className="mb-2 flex items-center gap-1.5 text-[12.5px] text-fg-3">
                  <Sparkles className="size-3.5 text-violet-300" /> AI summary
                </div>
                <p className="text-[14px] leading-relaxed text-fg-2">{current.summary}</p>
              </div>
              {current.followUp && (
                <div className="rounded-xl bg-saffron-500/[0.07] p-3 ring-1 ring-saffron-500/20">
                  <div className="text-[12.5px] font-medium text-saffron-400">Follow-up</div>
                  <p className="mt-1 text-[13px] text-fg-2">{current.followUp}</p>
                </div>
              )}
              <dl className="space-y-3 text-[13px]">
                {[
                  ["Intent", <Badge key="i" tone="violet">{current.intent}</Badge>],
                  ["Language", current.language],
                  ["Sentiment", <span key="s" className={cn("capitalize", current.sentiment === "negative" ? "text-bad" : current.sentiment === "positive" ? "text-teal-400" : "text-fg-2")}>{current.sentiment}</span>],
                  ["Duration", formatDuration(current.durationSec)],
                  ["Customer since", formatDate(cu.firstSeen, { month: "short", year: "numeric" })],
                  ["Messages opt-in", cu.optedIn ? "Yes" : "Opted out (STOP)"],
                ].map(([k, v]) => (
                  <div key={String(k)} className="flex items-center justify-between gap-3">
                    <dt className="text-fg-3">{k}</dt>
                    <dd className="text-right text-fg-2">{v}</dd>
                  </div>
                ))}
              </dl>
              {current.status === "handoff" && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    setItems((all) => all.map((c) => (c.id === current.id ? { ...c, status: "answered" } : c)));
                    toast("Marked as handled");
                  }}
                >
                  Mark as handled
                </Button>
              )}
            </aside>
          </div>
        ) : (
          <div className="hidden place-items-center text-sm text-fg-3 lg:grid">Pick a conversation to read the transcript.</div>
        )}
      </div>
    </>
  );
}

export default function ConversationsPage() {
  return (
    <Suspense>
      <ConversationsInner />
    </Suspense>
  );
}
