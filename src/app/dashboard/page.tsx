"use client";
import { ArrowUpRight, BookOpen, IndianRupee, PhoneCall, UserRound } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { AreaChart, Legend, Sparkline } from "@/components/charts/charts";
import { ChannelIcon, Delta, StatusBadge, apptMeta } from "@/components/dashboard/bits";
import { Panel, useLive } from "@/components/dashboard/shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/controls";
import { useToast } from "@/components/ui/toast";
import {
  DEMO_TODAY,
  customerById,
  getAppointments,
  getBusiness,
  getConversations,
  getDailyVolume,
  getKnowledgeGaps,
  serviceById,
  staffById,
} from "@/lib/services";
import { cn, formatDate, formatINR, formatTime } from "@/lib/utils";

export default function OverviewPage() {
  const biz = getBusiness();
  const volume = getDailyVolume();
  const convos = getConversations();
  const { live } = useLive();
  const toast = useToast();
  const [range, setRange] = useState<"7" | "14" | "30">("14");
  const [done, setDone] = useState<string[]>([]);

  const today = volume[volume.length - 1];
  const lastWeek = volume[volume.length - 8];
  const pct = (a: number, b: number) => Math.round(((a - b) / b) * 100);

  const todaysAppts = getAppointments()
    .filter((a) => a.start.startsWith(DEMO_TODAY))
    .sort((a, b) => a.start.localeCompare(b.start));
  const estRevenue = getAppointments()
    .filter((a) => a.start >= DEMO_TODAY && a.status !== "cancelled" && a.status !== "no-show")
    .reduce((s, a) => s + (serviceById(a.serviceId)?.priceINR ?? 0), 0);

  const sliced = volume.slice(-Number(range));
  const series = useMemo(
    () => [
      { key: "wa", label: "WhatsApp", color: "var(--color-series-2)", values: sliced.map((d) => d.whatsapp) },
      { key: "call", label: "Calls", color: "var(--color-series-1)", values: sliced.map((d) => d.calls) },
    ],
    [sliced],
  );

  const attention = [
    { id: "a1", icon: PhoneCall, tone: "warn" as const, title: "Sameer Joshi asked for you", body: "Upset about wait time on his last visit. Call back today.", cta: "Mark as called" },
    { id: "a2", icon: UserRound, tone: "violet" as const, title: "Kabir wants a slot tomorrow", body: "You're normally closed Tuesdays. Reppy is waiting for your yes.", cta: "Open chat", href: "/dashboard/conversations" },
    { id: "a3", icon: BookOpen, tone: "saffron" as const, title: `${getKnowledgeGaps().filter((g) => g.status === "waiting").length} questions Reppy couldn't answer`, body: "Parking and head massage. Answer once and Reppy remembers.", cta: "Answer", href: "/dashboard/knowledge" },
    { id: "a4", icon: IndianRupee, tone: "neutral" as const, title: "₹200 deposit pending", body: "Fatima Shaikh, bridal trial on Fri 27 Nov.", cta: "Mark paid" },
  ].filter((a) => !done.includes(a.id));

  const kpis = [
    { label: "Conversations today", value: today.whatsapp + today.calls, delta: pct(today.whatsapp + today.calls, lastWeek.whatsapp + lastWeek.calls), spark: volume.slice(-14).map((d) => d.whatsapp + d.calls) },
    { label: "Booked by Reppy", value: today.bookings, delta: pct(today.bookings, lastWeek.bookings), spark: volume.slice(-14).map((d) => d.bookings) },
    { label: "Missed calls recovered", value: today.missedRecovered, delta: pct(today.missedRecovered + 1, lastWeek.missedRecovered + 1), spark: volume.slice(-14).map((d) => d.missedRecovered) },
    { label: "Upcoming bookings (est.)", value: formatINR(estRevenue), delta: 12, spark: volume.slice(-14).map((d) => d.bookings * 900), note: "vs last week" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[13px] text-fg-3">{formatDate(DEMO_TODAY, { weekday: "long", day: "numeric", month: "long" })}</p>
          <h1 className="display mt-1 text-[44px] md:text-[52px]">Good evening, {biz.owner.split(" ")[0]}</h1>
          <p className="mt-2 max-w-xl text-[15px] text-fg-2">
            Reppy handled {today.whatsapp + today.calls} conversations today and booked {today.bookings} appointments.
            {!live && " Bookings are paused — Reppy is only answering questions."}
          </p>
        </div>
        <Link href="/#demo" className="text-[13px] text-fg-3 underline decoration-line-strong underline-offset-4 hover:text-fg">
          Try Reppy as a customer
        </Link>
      </div>

      {/* KPI strip: one surface, four cells */}
      <section className="panel grid grid-cols-2 divide-line lg:grid-cols-4 lg:divide-x [&>*:nth-child(-n+2)]:border-b [&>*:nth-child(-n+2)]:border-line lg:[&>*:nth-child(-n+2)]:border-b-0 [&>*:nth-child(odd)]:border-r [&>*:nth-child(odd)]:border-line lg:[&>*:nth-child(odd)]:border-r-0">
        {kpis.map((k) => (
          <div key={k.label} className="p-5">
            <div className="text-[13px] text-fg-3">{k.label}</div>
            <div className="mt-2 flex items-end justify-between gap-2">
              <div className="text-[28px] font-semibold tracking-tight tabular-nums">{k.value}</div>
              <Sparkline values={k.spark} className="mb-1 hidden sm:block" />
            </div>
            <div className="mt-1.5 flex items-center gap-2 text-[12px] text-fg-3">
              <Delta value={k.delta} />
              <span>{k.note ?? "vs last Monday"}</span>
            </div>
          </div>
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-3">
        <Panel
          className="xl:col-span-2"
          title="Conversations by channel"
          action={
            <Segmented
              size="sm"
              value={range}
              onChange={setRange}
              options={[
                { value: "7", label: "7 days" },
                { value: "14", label: "14 days" },
                { value: "30", label: "30 days" },
              ]}
            />
          }
        >
          <Legend items={series.map((s) => ({ label: s.label, color: s.color }))} />
          <div className="mt-3">
            <AreaChart labels={sliced.map((d) => d.date)} series={series} height={250} formatLabel={(d) => formatDate(d)} />
          </div>
        </Panel>

        <Panel title="Needs your attention" action={<Badge tone="warn">{attention.length}</Badge>}>
          {attention.length === 0 ? (
            <p className="py-10 text-center text-sm text-fg-3">All clear. Reppy will message you on WhatsApp if anything comes up.</p>
          ) : (
            <ul className="-my-1 divide-y divide-line">
              {attention.map((a) => (
                <li key={a.id} className="flex gap-3 py-3.5">
                  <span
                    className={cn(
                      "grid size-8 shrink-0 place-items-center rounded-full",
                      a.tone === "warn" && "bg-saffron-500/12 text-saffron-400",
                      a.tone === "violet" && "bg-violet-500/12 text-violet-300",
                      a.tone === "saffron" && "bg-saffron-500/12 text-saffron-400",
                      a.tone === "neutral" && "bg-white/[0.06] text-fg-2",
                    )}
                  >
                    <a.icon className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[14px] font-medium">{a.title}</div>
                    <p className="mt-0.5 text-[13px] text-fg-3">{a.body}</p>
                    {a.href ? (
                      <Link href={a.href} className="mt-2 inline-flex items-center gap-1 text-[13px] font-medium text-violet-300 hover:text-violet-400">
                        {a.cta} <ArrowUpRight className="size-3.5" />
                      </Link>
                    ) : (
                      <button
                        onClick={() => {
                          setDone((d) => [...d, a.id]);
                          toast(a.cta === "Mark paid" ? "Deposit marked as paid. Booking confirmed." : "Marked as called", {
                            label: "Undo",
                            run: () => setDone((d) => d.filter((x) => x !== a.id)),
                          });
                        }}
                        className="mt-2 text-[13px] font-medium text-violet-300 hover:text-violet-400"
                      >
                        {a.cta}
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-5">
        <Panel className="xl:col-span-2" title="Today's schedule" action={<Link href="/dashboard/appointments" className="text-[13px] text-fg-3 hover:text-fg">Calendar</Link>}>
          <ol className="relative space-y-1 before:absolute before:top-2 before:bottom-2 before:left-[3.4rem] before:w-px before:bg-line">
            {todaysAppts.map((a) => {
              const s = serviceById(a.serviceId)!;
              const c = customerById(a.customerId)!;
              const past = a.status === "completed";
              return (
                <li key={a.id} className="relative flex items-start gap-4 rounded-xl py-2.5">
                  <span className={cn("w-11 shrink-0 pt-0.5 text-right text-[12.5px] tabular-nums", past ? "text-fg-3" : "text-fg-2")}>{formatTime(a.start)}</span>
                  <span className={cn("relative z-10 mt-1.5 size-2.5 shrink-0 rounded-full ring-4 ring-ink-850", past ? "bg-ink-600" : "bg-violet-400")} />
                  <div className={cn("min-w-0 flex-1", past && "opacity-60")}>
                    <div className="text-[14px] font-medium">{s.name}</div>
                    <div className="text-[13px] text-fg-3">
                      {c.name} with {staffById(a.staffId)?.name}, {s.durationMin} min
                    </div>
                  </div>
                  <Badge tone={apptMeta[a.status].tone}>{apptMeta[a.status].label}</Badge>
                </li>
              );
            })}
          </ol>
        </Panel>

        <Panel className="xl:col-span-3" title="Latest conversations" action={<Link href="/dashboard/conversations" className="text-[13px] text-fg-3 hover:text-fg">View all</Link>}>
          <ul className="-my-1 divide-y divide-line">
            {convos.slice(0, 6).map((c) => {
              const cu = customerById(c.customerId)!;
              return (
                <li key={c.id}>
                  <Link href={`/dashboard/conversations?id=${c.id}`} className="flex items-center gap-3 py-3 hover:bg-white/[0.015]">
                    <ChannelIcon channel={c.channel} missed={c.durationSec === 0 && c.channel === "call"} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-[14px] font-medium">{cu.name}</span>
                        <span className="text-[12px] text-fg-3">{c.language}</span>
                      </div>
                      <p className="truncate text-[13px] text-fg-3">{c.summary}</p>
                    </div>
                    <div className="hidden shrink-0 flex-col items-end gap-1 sm:flex">
                      <StatusBadge status={c.status} />
                      <span className="text-[12px] text-fg-3">{formatTime(c.startedAt)}</span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="mt-3 flex justify-end">
            <Button variant="ghost" size="sm" onClick={() => toast("Daily report sent to +91 98200 41177 on WhatsApp")}>
              Send today&apos;s report to my WhatsApp
            </Button>
          </div>
        </Panel>
      </div>
    </div>
  );
}
