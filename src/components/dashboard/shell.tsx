"use client";
import {
  BarChart3,
  BookOpen,
  Bot,
  CalendarDays,
  LayoutGrid,
  Menu,
  MessagesSquare,
  Settings,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useContext, useState } from "react";
import { DashboardSearch, Notifications } from "@/components/dashboard/search";
import { Avatar } from "@/components/ui/avatar";
import { Logo } from "@/components/ui/logo";
import { ToastProvider, useToast } from "@/components/ui/toast";
import { getBusiness, getKnowledgeGaps } from "@/lib/services";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "Overview", icon: LayoutGrid },
  { href: "/dashboard/conversations", label: "Conversations", icon: MessagesSquare },
  { href: "/dashboard/appointments", label: "Appointments", icon: CalendarDays },
  { href: "/dashboard/customers", label: "Customers", icon: Users },
  { href: "/dashboard/receptionist", label: "AI Receptionist", icon: Bot },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/knowledge", label: "Knowledge Base", icon: BookOpen },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

// Whether Reppy is accepting bookings — shared so the topbar and Overview agree.
const LiveCtx = createContext<{ live: boolean; setLive: (v: boolean) => void }>({ live: true, setLive: () => {} });
export const useLive = () => useContext(LiveCtx);

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const path = usePathname();
  const waiting = getKnowledgeGaps().filter((g) => g.status === "waiting").length;
  return (
    <nav aria-label="Dashboard" className="space-y-0.5">
      {nav.map(({ href, label, icon: Icon }) => {
        const active = href === "/dashboard" ? path === "/dashboard" || path === "/dashboard/" : path.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] transition-colors",
              active ? "bg-violet-500/12 text-fg" : "text-fg-3 hover:bg-white/[0.04] hover:text-fg-2",
            )}
          >
            {active && <span className="absolute inset-y-2 left-0 w-[3px] rounded-r bg-violet-400" />}
            <Icon className={cn("size-[18px]", active ? "text-violet-300" : "")} strokeWidth={1.75} />
            {label}
            {label === "Knowledge Base" && waiting > 0 && (
              <span className="ml-auto rounded-full bg-saffron-500/15 px-1.5 text-[11px] font-semibold text-saffron-400">{waiting}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarFooter() {
  const biz = getBusiness();
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-line bg-white/[0.02] p-3.5">
        <div className="flex items-center justify-between text-[12.5px]">
          <span className="text-fg-2">Conversations this month</span>
          <span className="tabular-nums text-fg">412 / 500</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink-600">
          <div className="h-full w-[82%] rounded-full bg-violet-500" />
        </div>
        <p className="mt-2 text-[12px] text-fg-3">Usage cap keeps costs predictable. Resets 1 Dec.</p>
      </div>
      <div className="flex items-center gap-3 px-1">
        <Avatar name={biz.owner} size={34} />
        <div className="min-w-0 text-[13px] leading-tight">
          <div className="truncate font-medium">{biz.owner}</div>
          <div className="truncate text-fg-3">Owner, {biz.name}</div>
        </div>
      </div>
    </div>
  );
}

function Topbar({ onMenu }: { onMenu: () => void }) {
  const biz = getBusiness();
  const { live, setLive } = useLive();
  const toast = useToast();
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-ink-950/80 px-4 backdrop-blur-xl md:px-8">
      <button onClick={onMenu} className="rounded-lg p-2 text-fg-2 hover:bg-white/5 lg:hidden" aria-label="Open menu">
        <Menu className="size-5" />
      </button>
      <div className="hidden min-w-0 items-center gap-2 text-sm sm:flex">
        <span className="font-medium">{biz.name}</span>
        <span className="text-fg-3">{biz.type}, Bandra</span>
      </div>
      <span className="hidden rounded-full border border-dashed border-line-strong px-2.5 py-0.5 text-[11.5px] text-fg-3 md:inline">
        Sample data
      </span>
      <div className="ml-auto flex items-center gap-2">
        <DashboardSearch />
        <button
          onClick={() => {
            setLive(!live);
            toast(live ? "Bookings paused. Reppy will still answer questions." : "Bookings resumed");
          }}
          className={cn(
            "flex h-9 items-center gap-2 rounded-full px-3.5 text-[13px] font-medium ring-1 transition-colors",
            live ? "bg-teal-500/10 text-teal-400 ring-teal-500/30" : "bg-saffron-500/10 text-saffron-400 ring-saffron-500/30",
          )}
          aria-pressed={!live}
        >
          <span className={cn("size-2 rounded-full bg-current", live && "animate-pulse-soft")} />
          {live ? "Reppy is live" : "Bookings paused"}
        </button>
<Notifications />
      </div>
    </header>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [live, setLive] = useState(true);
  return (
    <ToastProvider>
      <LiveCtx.Provider value={{ live, setLive }}>
        <div className="min-h-dvh lg:pl-64">
          <aside aria-label="Sidebar" className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col justify-between border-r border-line bg-ink-900/60 p-4 lg:flex">
            <div>
              <Logo className="mb-8 px-2 pt-2" />
              <NavList />
            </div>
            <SidebarFooter />
          </aside>

          {open && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div className="absolute inset-0 bg-ink-950/70" onClick={() => setOpen(false)} />
              <aside aria-label="Menu" className="absolute inset-y-0 left-0 flex w-72 flex-col justify-between border-r border-line bg-ink-900 p-4">
                <div>
                  <div className="mb-8 flex items-center justify-between px-2 pt-2">
                    <Logo />
                    <button onClick={() => setOpen(false)} aria-label="Close menu" className="rounded-lg p-1.5 text-fg-2 hover:bg-white/5">
                      <X className="size-5" />
                    </button>
                  </div>
                  <NavList onNavigate={() => setOpen(false)} />
                </div>
                <SidebarFooter />
              </aside>
            </div>
          )}

          <Topbar onMenu={() => setOpen(true)} />
          <main className="mx-auto max-w-[1400px] px-4 py-6 md:px-8 md:py-8">{children}</main>
        </div>
      </LiveCtx.Provider>
    </ToastProvider>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-[26px] font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-[14px] text-fg-3">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({
  title,
  action,
  className,
  children,
  bodyClassName,
}: {
  title?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("panel", className)}>
      {title && (
        <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-1">
          <h2 className="text-[15px] font-medium">{title}</h2>
          {action}
        </div>
      )}
      <div className={cn("p-5", title ? "pt-3" : "", bodyClassName)}>{children}</div>
    </section>
  );
}
