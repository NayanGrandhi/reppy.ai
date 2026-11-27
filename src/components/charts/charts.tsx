"use client";
// Lightweight SVG charts — no chart library, so the bundle stays small and the
// look matches the design system exactly. Series colours come from the validated
// palette in globals.css (--color-series-1..4). Text never uses series colours.
import { useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [w, setW] = useState(0);
  useLayoutEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

export type Series = { key: string; label: string; color: string; values: number[] };

function niceMax(v: number) {
  if (v <= 0) return 1;
  const p = 10 ** Math.floor(Math.log10(v));
  const n = v / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p;
}

function smoothPath(pts: [number, number][]) {
  if (pts.length < 2) return "";
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[i + 1];
    const cx = (x0 + x1) / 2;
    d += ` C${cx},${y0} ${cx},${y1} ${x1},${y1}`;
  }
  return d;
}

export function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-fg-2">
      {items.map((i) => (
        <span key={i.label} className="inline-flex items-center gap-1.5">
          <span className="h-2 w-3 rounded-sm" style={{ background: i.color }} />
          {i.label}
        </span>
      ))}
    </div>
  );
}

/** Multi-series line + soft area with crosshair tooltip. */
export function AreaChart({
  labels,
  series,
  height = 240,
  formatLabel = (s) => s,
}: {
  labels: string[];
  series: Series[];
  height?: number;
  formatLabel?: (s: string) => string;
}) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const pad = { l: 34, r: 8, t: 12, b: 26 };
  const W = Math.max(width, 200);
  const H = height;
  const iw = W - pad.l - pad.r;
  const ih = H - pad.t - pad.b;
  const max = niceMax(Math.max(...series.flatMap((s) => s.values)) * 1.08);
  const n = labels.length;
  const x = (i: number) => pad.l + (n === 1 ? iw / 2 : (i / (n - 1)) * iw);
  const y = (v: number) => pad.t + ih - (v / max) * ih;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * max);
  const labelEvery = Math.ceil(n / Math.max(2, Math.floor(iw / 70)));

  const onMove = (e: React.PointerEvent<SVGRectElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - r.left;
    setHover(Math.max(0, Math.min(n - 1, Math.round((px / r.width) * (n - 1)))));
  };

  return (
    <div ref={ref} className="relative w-full" style={{ height: H }}>
      {width > 0 && (
        <svg width={W} height={H} role="img" aria-label={`Chart of ${series.map((s) => s.label).join(" and ")}`}>
          <defs>
            {series.map((s) => (
              <linearGradient key={s.key} id={`ag-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor={s.color} stopOpacity="0.28" />
                <stop offset="1" stopColor={s.color} stopOpacity="0" />
              </linearGradient>
            ))}
          </defs>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="rgb(255 255 255 / 0.06)" />
              <text x={pad.l - 8} y={y(t)} dy="0.32em" textAnchor="end" className="fill-fg-3 text-[11px]">
                {Math.round(t)}
              </text>
            </g>
          ))}
          {labels.map((l, i) =>
            (i % labelEvery === 0 && n - 1 - i >= labelEvery * 0.6) || i === n - 1 ? (
              <text key={l + i} x={x(i)} y={H - 6} textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"} className="fill-fg-3 text-[11px]">
                {formatLabel(l)}
              </text>
            ) : null,
          )}
          {series.map((s) => {
            const pts = s.values.map((v, i) => [x(i), y(v)] as [number, number]);
            const line = smoothPath(pts);
            return (
              <g key={s.key}>
                <path d={`${line} L${x(n - 1)},${y(0)} L${x(0)},${y(0)} Z`} fill={`url(#ag-${s.key})`} />
                <path d={line} fill="none" stroke={s.color} strokeWidth={2} strokeLinecap="round" />
              </g>
            );
          })}
          {hover !== null && (
            <g pointerEvents="none">
              <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={pad.t + ih} stroke="rgb(255 255 255 / 0.25)" strokeDasharray="3 3" />
              {series.map((s) => (
                <circle key={s.key} cx={x(hover)} cy={y(s.values[hover])} r={4.5} fill={s.color} stroke="#110f1e" strokeWidth={2} />
              ))}
            </g>
          )}
          <rect x={pad.l} y={pad.t} width={iw} height={ih} fill="transparent" onPointerMove={onMove} onPointerLeave={() => setHover(null)} />
        </svg>
      )}
      {hover !== null && width > 0 && (
        <div
          className="pointer-events-none absolute top-2 z-10 min-w-36 rounded-xl border border-line-strong bg-ink-700/95 px-3 py-2 text-[12.5px] shadow-xl backdrop-blur"
          style={{ left: Math.min(Math.max(x(hover) + 12, 0), W - 160) }}
        >
          <div className="mb-1 text-fg-3">{formatLabel(labels[hover])}</div>
          {series.map((s) => (
            <div key={s.key} className="flex items-center justify-between gap-4">
              <span className="inline-flex items-center gap-1.5 text-fg-2">
                <span className="size-2 rounded-full" style={{ background: s.color }} />
                {s.label}
              </span>
              <span className="font-medium tabular-nums text-fg">{s.values[hover]}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Single-series vertical bars with per-bar tooltip. */
export function BarChart({
  labels,
  values,
  color = "var(--color-series-1)",
  height = 200,
  format = (v) => String(v),
  highlight,
}: {
  labels: string[];
  values: number[];
  color?: string;
  height?: number;
  format?: (v: number) => string;
  highlight?: number;
}) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const pad = { l: 8, r: 8, t: 22, b: 24 };
  const W = Math.max(width, 160);
  const ih = height - pad.t - pad.b;
  const n = values.length;
  const slot = (W - pad.l - pad.r) / n;
  const bw = Math.min(28, slot - 6);
  const max = niceMax(Math.max(...values) * 1.05);
  return (
    <div ref={ref} className="relative w-full" style={{ height }}>
      {width > 0 && (
        <svg width={W} height={height} role="img" aria-label="Bar chart">
          <line x1={pad.l} x2={W - pad.r} y1={pad.t + ih} y2={pad.t + ih} stroke="rgb(255 255 255 / 0.1)" />
          {values.map((v, i) => {
            const h = Math.max(2, (v / max) * ih);
            const cx = pad.l + slot * i + slot / 2;
            const active = hover === i || highlight === i;
            return (
              <g key={i} onPointerEnter={() => setHover(i)} onPointerLeave={() => setHover(null)}>
                <rect x={cx - slot / 2} y={pad.t} width={slot} height={ih} fill="transparent" />
                <path
                  d={`M${cx - bw / 2},${pad.t + ih} V${pad.t + ih - h + 4} q0,-4 4,-4 h${bw - 8} q4,0 4,4 V${pad.t + ih} Z`}
                  fill={color}
                  opacity={hover === null ? (highlight === undefined || active ? 1 : 0.55) : active ? 1 : 0.4}
                />
                {(hover === i || (hover === null && highlight === i)) && (
                  <text x={cx} y={pad.t + ih - h - 7} textAnchor="middle" className="fill-fg text-[11.5px] font-medium">
                    {format(v)}
                  </text>
                )}
                <text x={cx} y={height - 6} textAnchor="middle" className="fill-fg-3 text-[11px]">
                  {labels[i]}
                </text>
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
}

/** Weekday × hour heatmap, sequential violet ramp. */
export function Heatmap({ rows, cols, data }: { rows: string[]; cols: string[]; data: number[][] }) {
  const [hover, setHover] = useState<[number, number] | null>(null);
  const max = Math.max(...data.flat());
  return (
    <div className="relative">
      <div className="grid gap-[3px]" style={{ gridTemplateColumns: `2.5rem repeat(${cols.length}, minmax(0,1fr))` }}>
        {data.map((row, r) => (
          <div key={rows[r]} className="contents">
            <div className="flex items-center text-[11.5px] text-fg-3">{rows[r]}</div>
            {row.map((v, c) => {
              const t = v / max;
              return (
                <div
                  key={c}
                  onPointerEnter={() => setHover([r, c])}
                  onPointerLeave={() => setHover(null)}
                  className={cn("aspect-[1.4] rounded-[4px] transition-transform", hover?.[0] === r && hover?.[1] === c && "scale-110 ring-2 ring-fg/70")}
                  style={{ background: `color-mix(in oklab, #8b7bff ${Math.round(8 + t * 86)}%, #161429)` }}
                  role="img"
                  aria-label={`${rows[r]} ${cols[c]}: ${v} conversations`}
                />
              );
            })}
          </div>
        ))}
        <div />
        {cols.map((c, i) => (
          <div key={c} className="pt-1 text-center text-[11px] text-fg-3">
            {i % 2 === 0 ? c : ""}
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2 text-[11.5px] text-fg-3">
        <span>Fewer</span>
        <span className="h-2 w-24 rounded-full" style={{ background: "linear-gradient(90deg, color-mix(in oklab,#8b7bff 8%,#161429), #8b7bff)" }} />
        <span>More</span>
        {hover && (
          <span className="ml-auto text-fg-2">
            {rows[hover[0]]} {cols[hover[1]]}: <span className="font-medium text-fg">{data[hover[0]][hover[1]]}</span> conversations
          </span>
        )}
      </div>
    </div>
  );
}

/** Donut with centre total. Segments separated by a 2px surface gap. */
export function Donut({
  segments,
  size = 168,
  label = "Total",
}: {
  segments: { label: string; value: number; color: string }[];
  size?: number;
  label?: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const total = segments.reduce((a, s) => a + s.value, 0);
  const r = size / 2 - 12;
  const c = 2 * Math.PI * r;
  let acc = 0;
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-4">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90" role="img" aria-label="Breakdown">
          {segments.map((s, i) => {
            const len = total ? (s.value / total) * c : 0;
            const el = (
              <circle
                key={s.label}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={s.color}
                strokeWidth={hover === i ? 18 : 14}
                strokeDasharray={`${Math.max(0, len - 3)} ${c}`}
                strokeDashoffset={-acc}
                onPointerEnter={() => setHover(i)}
                onPointerLeave={() => setHover(null)}
                className="transition-[stroke-width]"
              />
            );
            acc += len;
            return el;
          })}
        </svg>
        <div className="absolute inset-0 grid place-content-center text-center">
          <div className="text-2xl font-semibold tabular-nums">{hover === null ? total : segments[hover].value}</div>
          <div className="text-[12px] text-fg-3">{hover === null ? label : segments[hover].label}</div>
        </div>
      </div>
      <ul className="space-y-2 text-[13px]">
        {segments.map((s) => (
          <li key={s.label} className="flex items-center gap-3">
            <span className="size-2.5 rounded-full" style={{ background: s.color }} />
            <span className="w-24 text-fg-2">{s.label}</span>
            <span className="tabular-nums text-fg">{s.value}</span>
            <span className="tabular-nums text-fg-3">{total ? Math.round((s.value / total) * 100) : 0}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Sparkline({ values, color = "var(--color-series-1)", className }: { values: number[]; color?: string; className?: string }) {
  const w = 96;
  const h = 28;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const pts = values.map((v, i) => [(i / (values.length - 1)) * w, h - 2 - ((v - min) / (max - min || 1)) * (h - 4)] as [number, number]);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={cn("h-7 w-24", className)} aria-hidden>
      <path d={smoothPath(pts)} fill="none" stroke={color} strokeWidth={1.75} strokeLinecap="round" />
    </svg>
  );
}
