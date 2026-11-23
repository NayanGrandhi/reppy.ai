"use client";
import { useState } from "react";
import { AreaChart, BarChart, Donut, Heatmap, Legend } from "@/components/charts/charts";
import { Delta } from "@/components/dashboard/bits";
import { Panel, PageHeader } from "@/components/dashboard/shell";
import { Badge } from "@/components/ui/badge";
import { Segmented } from "@/components/ui/controls";
import { getDailyVolume, getPeakHours, getTopQuestions } from "@/lib/services";
import { formatDate } from "@/lib/utils";

export default function AnalyticsPage() {
  const all = getDailyVolume();
  const [range, setRange] = useState<"7" | "30">("30");
  const d = all.slice(-Number(range));
  const sum = (k: "whatsapp" | "calls" | "bookings" | "missedRecovered") => d.reduce((a, x) => a + x[k], 0);
  const convos = sum("whatsapp") + sum("calls");
  const conversion = Math.round((sum("bookings") / convos) * 100);
  const hours = Array.from({ length: 13 }, (_, i) => {
    const h = 9 + i;
    return h === 12 ? "12p" : h > 12 ? `${h - 12}p` : `${h}a`;
  });
  const questions = getTopQuestions();
  const maxQ = Math.max(...questions.map((q) => q.count));

  const kpis = [
    { label: "Conversations", value: convos.toLocaleString("en-IN"), delta: 18 },
    { label: "Booking conversion", value: `${conversion}%`, delta: 4 },
    { label: "Handled without you", value: "94%", delta: 2 },
    { label: "Avg. call length", value: "1:52", delta: -6, hint: "shorter is better" },
    { label: "Missed calls recovered", value: sum("missedRecovered"), delta: 22 },
  ];

  return (
    <>
      <PageHeader
        title="Analytics"
        description="How Reppy is doing and when your customers reach out."
        actions={
          <Segmented
            value={range}
            onChange={setRange}
            options={[
              { value: "7", label: "Last 7 days" },
              { value: "30", label: "Last 30 days" },
            ]}
          />
        }
      />

      <section className="panel mb-6 grid grid-cols-2 gap-px overflow-hidden bg-line md:grid-cols-5">
        {kpis.map((k) => (
          <div key={k.label} className="bg-ink-850 p-5">
            <div className="text-[13px] text-fg-3">{k.label}</div>
            <div className="mt-2 text-[26px] font-semibold tracking-tight tabular-nums">{k.value}</div>
            <div className="mt-1 flex items-center gap-2 text-[12px] text-fg-3">
              <Delta value={k.delta} /> {k.hint ?? "vs previous period"}
            </div>
          </div>
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-3">
        <Panel className="xl:col-span-2" title="Conversations and bookings">
          <Legend
            items={[
              { label: "Conversations", color: "var(--color-series-1)" },
              { label: "Bookings", color: "var(--color-series-3)" },
            ]}
          />
          <div className="mt-3">
            <AreaChart
              labels={d.map((x) => x.date)}
              formatLabel={(s) => formatDate(s)}
              series={[
                { key: "c", label: "Conversations", color: "var(--color-series-1)", values: d.map((x) => x.whatsapp + x.calls) },
                { key: "b", label: "Bookings", color: "var(--color-series-3)", values: d.map((x) => x.bookings) },
              ]}
              height={260}
            />
          </div>
        </Panel>

        <Panel title="Channel split">
          <div className="flex h-full items-center py-4">
            <Donut
              label="Conversations"
              segments={[
                { label: "WhatsApp", value: sum("whatsapp"), color: "var(--color-series-2)" },
                { label: "Phone calls", value: sum("calls"), color: "var(--color-series-1)" },
              ]}
            />
          </div>
        </Panel>

        <Panel className="xl:col-span-2" title="Busiest hours" action={<span className="text-[12.5px] text-fg-3">Last 4 weeks</span>}>
          <Heatmap rows={["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]} cols={hours} data={getPeakHours()} />
          <p className="mt-4 text-[13px] text-fg-2">
            Saturdays 5–7 pm are your busiest. Reppy answered every one of those without a missed call.
          </p>
        </Panel>

        <Panel title="Bookings by weekday">
          <BarChart
            labels={["M", "T", "W", "T", "F", "S", "S"]}
            values={[38, 9, 34, 37, 46, 63, 51]}
            highlight={5}
            color="var(--color-series-1)"
            height={220}
          />
        </Panel>

        <Panel className="xl:col-span-3" title="What customers ask most">
          <ul className="grid gap-x-10 gap-y-3 md:grid-cols-2">
            {questions.map((q) => (
              <li key={q.q} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1.5">
                <span className="flex items-center gap-2 text-[14px]">
                  {q.q}
                  {q.unanswered && <Badge tone="warn">Reppy needs an answer</Badge>}
                </span>
                <span className="text-[13px] tabular-nums text-fg-2">{q.count}</span>
                <span className="col-span-2 h-1.5 overflow-hidden rounded-full bg-ink-700">
                  <span className="block h-full rounded-full bg-violet-500" style={{ width: `${(q.count / maxQ) * 100}%` }} />
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  );
}
