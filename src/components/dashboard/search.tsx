"use client";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, CalendarDays, IndianRupee, MessagesSquare, PhoneCall, Search, UserRound, BookOpen } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { customerById, getAppointments, getConversations, getCustomers, getKnowledgeGaps, serviceById } from "@/lib/services";
import { cn, formatDay, formatTime } from "@/lib/utils";

type Result = { id: string; group: string; title: string; sub: string; href: string; icon: typeof Search };

function useOutside(ref: React.RefObject<HTMLElement | null>, onOut: () => void) {
  useEffect(() => {
    const h = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && onOut();
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [ref, onOut]);
}

/** Search across customers, conversations and appointments. Press / to focus. */
export function DashboardSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  useOutside(box, () => setOpen(false));

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName) && !t.isContentEditable) {
        e.preventDefault();
        input.current?.focus();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const results = useMemo<Result[]>(() => {
    const term = q.trim().toLowerCase();
    if (term.length < 2) return [];
    const has = (s: string) => s.toLowerCase().includes(term);
    const customers = getCustomers()
      .filter((c) => has(c.name) || c.phone.replace(/\s/g, "").includes(term.replace(/\s/g, "")))
      .slice(0, 4)
      .map((c) => ({ id: c.id, group: "Customers", title: c.name, sub: `${c.phone} · ${c.visits} visits`, href: `/dashboard/customers?open=${c.id}`, icon: UserRound }));
    const convos = getConversations()
      .filter((c) => has(c.summary) || has(customerById(c.customerId)?.name ?? "") || has(c.intent))
      .slice(0, 4)
      .map((c) => ({ id: c.id, group: "Conversations", title: customerById(c.customerId)?.name ?? "Customer", sub: c.summary, href: `/dashboard/conversations?id=${c.id}`, icon: MessagesSquare }));
    const appts = getAppointments()
      .filter((a) => has(customerById(a.customerId)?.name ?? "") || has(serviceById(a.serviceId)?.name ?? ""))
      .slice(0, 4)
      .map((a) => ({
        id: a.id,
        group: "Appointments",
        title: `${serviceById(a.serviceId)?.name} · ${customerById(a.customerId)?.name}`,
        sub: `${formatDay(a.start)}, ${formatTime(a.start)}`,
        href: "/dashboard/appointments",
        icon: CalendarDays,
      }));
    return [...customers, ...convos, ...appts];
  }, [q]);

  useEffect(() => setActive(0), [q]);

  const go = (r: Result) => {
    setOpen(false);
    setQ("");
    input.current?.blur();
    router.push(r.href);
  };

  let lastGroup = "";
  return (
    <div ref={box} className="relative hidden md:block">
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-fg-3" />
      <input
        ref={input}
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((a) => Math.min(a + 1, results.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => Math.max(a - 1, 0));
          } else if (e.key === "Enter" && results[active]) {
            go(results[active]);
          } else if (e.key === "Escape") {
            setOpen(false);
            input.current?.blur();
          }
        }}
        placeholder="Search customers, chats, bookings"
        aria-label="Search"
        role="combobox"
        aria-expanded={open && results.length > 0}
        aria-controls="dash-search-results"
        className="h-9 w-72 rounded-full bg-white/[0.04] pr-9 pl-9 text-[13px] ring-1 ring-line outline-none placeholder:text-fg-3 focus:ring-violet-500/50"
      />
      <kbd className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 rounded border border-line-strong px-1.5 text-[10.5px] text-fg-3">/</kbd>
      <AnimatePresence>
        {open && q.trim().length >= 2 && (
          <motion.div
            id="dash-search-results"
            role="listbox"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 z-50 mt-2 w-[26rem] overflow-hidden rounded-2xl border border-line-strong bg-ink-800/95 p-1.5 shadow-2xl backdrop-blur-xl"
          >
            {results.length === 0 ? (
              <p className="px-3 py-6 text-center text-[13px] text-fg-3">Nothing matches “{q.trim()}”.</p>
            ) : (
              results.map((r, i) => {
                const header = r.group !== lastGroup;
                lastGroup = r.group;
                return (
                  <div key={r.group + r.id}>
                    {header && <div className="px-3 pt-2 pb-1 text-[11.5px] text-fg-3">{r.group}</div>}
                    <button
                      role="option"
                      aria-selected={i === active}
                      onMouseEnter={() => setActive(i)}
                      onClick={() => go(r)}
                      className={cn("flex w-full items-start gap-3 rounded-xl px-3 py-2 text-left", i === active && "bg-white/[0.06]")}
                    >
                      <r.icon className="mt-0.5 size-4 shrink-0 text-fg-3" />
                      <span className="min-w-0">
                        <span className="block truncate text-[13.5px]">{r.title}</span>
                        <span className="block truncate text-[12px] text-fg-3">{r.sub}</span>
                      </span>
                    </button>
                  </div>
                );
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** The bell: things that need the owner, each linking to where to act. */
export function Notifications() {
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useOutside(box, () => setOpen(false));

  const items = useMemo(() => {
    const handoffs = getConversations()
      .filter((c) => c.status === "handoff")
      .map((c) => ({ id: c.id, icon: PhoneCall, title: `${customerById(c.customerId)?.name} asked for you`, sub: c.summary, href: `/dashboard/conversations?id=${c.id}` }));
    const gaps = getKnowledgeGaps()
      .filter((g) => g.status === "waiting")
      .map((g) => ({ id: g.id, icon: BookOpen, title: "Reppy needs an answer", sub: `“${g.question}” · asked ${g.timesAsked} times`, href: "/dashboard/knowledge" }));
    const deposits = getAppointments()
      .filter((a) => a.status === "awaiting-deposit")
      .map((a) => ({ id: a.id, icon: IndianRupee, title: "Deposit not received yet", sub: `${customerById(a.customerId)?.name}, ${serviceById(a.serviceId)?.name}`, href: "/dashboard/appointments" }));
    return [...handoffs, ...gaps, ...deposits];
  }, []);

  return (
    <div ref={box} className="relative">
      <button
        onClick={() => {
          setOpen((o) => !o);
          setSeen(true);
        }}
        className="relative rounded-full p-2 text-fg-2 hover:bg-white/5"
        aria-label={`Notifications, ${items.length} need attention`}
        aria-expanded={open}
      >
        <Bell className="size-[18px]" />
        {!seen && items.length > 0 && <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-saffron-500 ring-2 ring-ink-950" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 z-50 mt-2 w-[22rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-line-strong bg-ink-800/95 shadow-2xl backdrop-blur-xl"
          >
            <div className="border-b border-line px-4 py-3 text-[14px] font-medium">Needs your attention</div>
            <ul className="max-h-96 overflow-y-auto p-1.5">
              {items.map((n) => (
                <li key={n.id}>
                  <Link href={n.href} onClick={() => setOpen(false)} className="flex gap-3 rounded-xl px-3 py-2.5 hover:bg-white/[0.05]">
                    <n.icon className="mt-0.5 size-4 shrink-0 text-saffron-400" />
                    <span className="min-w-0">
                      <span className="block text-[13.5px]">{n.title}</span>
                      <span className="line-clamp-2 text-[12px] text-fg-3">{n.sub}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <p className="border-t border-line px-4 py-2.5 text-[12px] text-fg-3">Reppy also sends these to your WhatsApp.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
