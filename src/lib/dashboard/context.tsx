"use client";
import { createContext, useContext, useMemo } from "react";
import type { Customer } from "@/lib/types";
import { freeSlots } from "./slots";
import type { DashboardData } from "./types";

const Ctx = createContext<DashboardData | null>(null);

export function DashboardDataProvider({ data, children }: { data: DashboardData; children: React.ReactNode }) {
  return <Ctx.Provider value={data}>{children}</Ctx.Provider>;
}

/** Placeholder for chats from people who aren't saved customers (e.g. website chat). */
const visitor = (id: string, businessId: string): Customer => ({
  id,
  businessId,
  name: "Website visitor",
  phone: "Not shared",
  language: "English",
  firstSeen: "",
  visits: 0,
  spendINR: 0,
  tags: [],
  notes: "",
  optedIn: false,
});

/** Now in India time as "YYYY-MM-DDTHH:MM". */
export function istNowLocal() {
  const p = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date());
  const g = (t: string) => p.find((x) => x.type === t)?.value ?? "00";
  return `${g("year")}-${g("month")}-${g("day")}T${g("hour")}:${g("minute")}`;
}

/** The dashboard's data plus lookups. Same names the pages used with the old mock module. */
export function useData() {
  const d = useContext(Ctx);
  if (!d) throw new Error("useData must be used inside DashboardDataProvider");
  return useMemo(() => {
    const ctx = { business: d.business, staff: d.staff, services: d.services };
    return {
      data: d,
      live: d.mode === "live",
      DEMO_TODAY: d.today,
      getBusiness: () => d.business,
      getStaff: () => d.staff,
      getServices: () => d.services,
      getCustomers: () => d.customers,
      getConversations: () => d.conversations,
      getAppointments: () => d.appointments,
      getKnowledgeGaps: () => d.knowledgeGaps,
      getChangeLog: () => d.changeLog,
      getFaqs: () => d.faqs,
      getReceptionistConfig: () => d.receptionist,
      getDailyVolume: () => d.dailyVolume,
      getPeakHours: () => d.peakHours,
      getTopQuestions: () => d.topQuestions,
      customerById: (id: string) => d.customers.find((c) => c.id === id) ?? visitor(id, d.business.id),
      serviceById: (id: string) => d.services.find((s) => s.id === id),
      staffById: (id: string) => d.staff.find((s) => s.id === id),
      freeSlots: (date: string, service: Parameters<typeof freeSlots>[2], staffId: string, existing: Parameters<typeof freeSlots>[4], stepMin = 30) =>
        freeSlots(ctx, date, service, staffId, existing, stepMin, d.mode === "live" ? istNowLocal() : undefined),
    };
  }, [d]);
}
