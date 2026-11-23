// The single doorway between the UI and data.
// Today every function reads the mock data. In Phase 3+ each body becomes a
// Supabase query (scoped to the signed-in business by row-level security)
// without any page or component having to change.
import * as mock from "./mock/data";
import type { Appointment, Service } from "./types";

export const DEMO_TODAY = mock.DEMO_TODAY;

export const getBusiness = () => mock.business;
export const getStaff = () => mock.staff;
export const getServices = () => mock.services;
export const getCustomers = () => mock.customers;
export const getConversations = () => mock.conversations;
export const getAppointments = () => mock.appointments;
export const getKnowledgeGaps = () => mock.knowledgeGaps;
export const getChangeLog = () => mock.changeLog;
export const getFaqs = () => mock.faqs;
export const getReceptionistConfig = () => mock.receptionist;
export const getDailyVolume = () => mock.dailyVolume;
export const getPeakHours = () => mock.peakHours;
export const getTopQuestions = () => mock.topQuestions;

export const customerById = (id: string) => mock.customers.find((c) => c.id === id);
export const serviceById = (id: string) => mock.services.find((s) => s.id === id);
export const staffById = (id: string) => mock.staff.find((s) => s.id === id);

/**
 * Free start times for a service with a given staff member on a date.
 * Respects opening hours, the staff member's day off, service duration,
 * buffer time and existing bookings (no double booking).
 * The real backend repeats this check inside a database transaction so two
 * people grabbing the same slot at once can't both win.
 */
export function freeSlots(
  date: string,
  service: Service,
  staffId: string,
  existing: Appointment[],
  stepMin = 30,
): string[] {
  const biz = mock.business;
  const d = new Date(`${date}T12:00:00`);
  const dow = d.getDay();
  const hours = biz.hours[(dow + 6) % 7];
  const member = mock.staff.find((s) => s.id === staffId);
  if (!hours || hours.closed || member?.offDays.includes(dow)) return [];

  const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
  const open = toMin(hours.open);
  const close = toMin(hours.close);

  const busy = existing
    .filter((a) => a.staffId === staffId && a.start.startsWith(date) && a.status !== "cancelled")
    .map((a) => {
      const s = toMin(a.start.slice(11, 16));
      const dur = mock.services.find((x) => x.id === a.serviceId)?.durationMin ?? 30;
      return [s, s + dur + biz.bufferMin] as const;
    });

  const slots: string[] = [];
  for (let t = open; t + service.durationMin <= close; t += stepMin) {
    const end = t + service.durationMin + biz.bufferMin;
    if (busy.some(([s, e]) => t < e && end > s)) continue;
    slots.push(`${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`);
  }
  return slots;
}
