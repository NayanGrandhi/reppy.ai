import type { Appointment, Business, Service, Staff } from "@/lib/types";

/**
 * Free start times for a service with one staff member on a date.
 * Respects opening hours, the staff member's day off, service duration,
 * buffer time and existing bookings. The database repeats these checks
 * (book_slot) so two people grabbing one slot at once can't both win.
 */
export function freeSlots(
  ctx: { business: Business; staff: Staff[]; services: Service[] },
  date: string,
  service: Service,
  staffId: string,
  existing: Appointment[],
  stepMin = 30,
  notBefore?: string, // "YYYY-MM-DDTHH:MM" now, in India time: hide past slots
): string[] {
  const biz = ctx.business;
  const d = new Date(`${date}T12:00:00`);
  const dow = d.getDay();
  const hours = biz.hours[(dow + 6) % 7];
  const member = ctx.staff.find((s) => s.id === staffId);
  if (!hours || hours.closed || !hours.open || member?.offDays.includes(dow)) return [];

  const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
  const open = toMin(hours.open);
  const close = toMin(hours.close);

  const busy = existing
    .filter((a) => a.staffId === staffId && a.start.startsWith(date) && a.status !== "cancelled" && a.status !== "no-show")
    .map((a) => {
      const s = toMin(a.start.slice(11, 16));
      const dur = ctx.services.find((x) => x.id === a.serviceId)?.durationMin ?? 30;
      return [s, s + dur + biz.bufferMin] as const;
    });

  const earliest = notBefore && notBefore.slice(0, 10) === date ? toMin(notBefore.slice(11, 16)) : -1;
  const slots: string[] = [];
  for (let t = open; t + service.durationMin <= close; t += stepMin) {
    if (t <= earliest) continue;
    const end = t + service.durationMin + biz.bufferMin;
    if (busy.some(([s, e]) => t < e && end > s)) continue;
    slots.push(`${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`);
  }
  return slots;
}
