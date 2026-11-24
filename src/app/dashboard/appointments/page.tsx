"use client";
import { ChevronLeft, ChevronRight, IndianRupee, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { apptMeta } from "@/components/dashboard/bits";
import { UpiRequestCard } from "@/components/upi-request";
import { PageHeader } from "@/components/dashboard/shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input, Segmented, Select } from "@/components/ui/controls";
import { Drawer, Modal } from "@/components/ui/overlay";
import { useToast } from "@/components/ui/toast";
import {
  DEMO_TODAY,
  customerById,
  freeSlots,
  getAppointments,
  getBusiness,
  getCustomers,
  getServices,
  getStaff,
  serviceById,
  staffById,
} from "@/lib/services";
import type { Appointment, AppointmentStatus } from "@/lib/types";
import { addDays, cn, formatDate, formatDay, formatINR, formatTime } from "@/lib/utils";

const START_H = 9;
const END_H = 21;
const ROW = 56; // px per hour

// Staff identity colours (validated series palette)
const staffColor: Record<string, string> = {
  st_anita: "var(--color-series-1)",
  st_rahul: "var(--color-series-2)",
  st_meera: "var(--color-series-3)",
};

function mondayOf(date: string) {
  const d = new Date(`${date}T12:00:00`);
  return addDays(date, -((d.getDay() + 6) % 7));
}

export default function AppointmentsPage() {
  const biz = getBusiness();
  const staff = getStaff();
  const toast = useToast();
  const [appts, setAppts] = useState<Appointment[]>(getAppointments());
  const [weekStart, setWeekStart] = useState(mondayOf(DEMO_TODAY));
  const [who, setWho] = useState<string>("all");
  const [open, setOpen] = useState<Appointment | null>(null);
  const [creating, setCreating] = useState(false);

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const visible = appts.filter((a) => (who === "all" || a.staffId === who) && a.status !== "cancelled");

  const setStatus = (id: string, status: AppointmentStatus, msg: string) => {
    const prev = appts.find((a) => a.id === id)!;
    setAppts((all) => all.map((a) => (a.id === id ? { ...a, status, depositPaid: status === "confirmed" ? true : a.depositPaid } : a)));
    setOpen(null);
    toast(msg, { label: "Undo", run: () => setAppts((all) => all.map((a) => (a.id === id ? prev : a))) });
  };

  return (
    <>
      <PageHeader
        title="Appointments"
        description={`Staff schedules, ${biz.bufferMin}-minute buffers and closed days are applied automatically, so Reppy never double-books.`}
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus className="size-4" /> New appointment
          </Button>
        }
      />

      <div className="panel overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4">
          <div className="flex items-center gap-2">
            <button onClick={() => setWeekStart(addDays(weekStart, -7))} className="rounded-full p-2 text-fg-2 ring-1 ring-line hover:bg-white/5" aria-label="Previous week">
              <ChevronLeft className="size-4" />
            </button>
            <button onClick={() => setWeekStart(addDays(weekStart, 7))} className="rounded-full p-2 text-fg-2 ring-1 ring-line hover:bg-white/5" aria-label="Next week">
              <ChevronRight className="size-4" />
            </button>
            <span className="ml-2 text-[15px] font-medium">
              {formatDate(days[0])} – {formatDate(days[6], { day: "numeric", month: "short", year: "numeric" })}
            </span>
            {weekStart !== mondayOf(DEMO_TODAY) && (
              <Button variant="ghost" size="sm" onClick={() => setWeekStart(mondayOf(DEMO_TODAY))}>
                This week
              </Button>
            )}
          </div>
          <Segmented
            size="sm"
            value={who}
            onChange={setWho}
            options={[{ value: "all", label: "Everyone" }, ...staff.map((s) => ({ value: s.id, label: <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full" style={{ background: staffColor[s.id] }} />{s.name}</span> }))]}
          />
        </div>

        <div className="scroll-thin overflow-x-auto">
          <div className="min-w-[860px]">
            <div className="grid grid-cols-[56px_repeat(7,1fr)] border-b border-line">
              <div />
              {days.map((d) => {
                const isToday = d === DEMO_TODAY;
                const dow = new Date(`${d}T12:00:00`).getDay();
                const closed = biz.hours[(dow + 6) % 7].closed;
                return (
                  <div key={d} className="border-l border-line px-3 py-2.5">
                    <div className={cn("text-[12px]", isToday ? "text-violet-300" : "text-fg-3")}>{formatDate(d, { weekday: "short" })}</div>
                    <div className="flex items-center gap-2">
                      <span className={cn("text-[18px] font-semibold tabular-nums", isToday && "grid size-8 place-items-center rounded-full bg-violet-600 text-white text-[15px]")}>
                        {formatDate(d, { day: "numeric" })}
                      </span>
                      {closed && <span className="text-[11.5px] text-fg-3">Closed</span>}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="relative grid grid-cols-[56px_repeat(7,1fr)]" style={{ height: (END_H - START_H) * ROW }}>
              <div className="relative">
                {Array.from({ length: END_H - START_H }, (_, i) => (
                  <div key={i} className="absolute right-2 -translate-y-1/2 text-[11px] text-fg-3" style={{ top: i * ROW }}>
                    {i === 0 ? "" : formatTime(`2026-01-01T${String(START_H + i).padStart(2, "0")}:00:00`)}
                  </div>
                ))}
              </div>
              {days.map((d) => {
                const dow = new Date(`${d}T12:00:00`).getDay();
                const closed = biz.hours[(dow + 6) % 7].closed;
                return (
                  <div
                    key={d}
                    className={cn("relative border-l border-line", closed && "bg-[repeating-linear-gradient(135deg,transparent_0_8px,rgb(255_255_255/0.025)_8px_16px)]")}
                  >
                    {Array.from({ length: END_H - START_H }, (_, i) => (
                      <div key={i} className="absolute inset-x-0 border-t border-line/60" style={{ top: i * ROW }} />
                    ))}
                    {d === DEMO_TODAY && (
                      <div className="absolute inset-x-0 z-10 h-px bg-saffron-500" style={{ top: (19.8 - START_H) * ROW }}>
                        <span className="absolute -top-1 -left-1 size-2 rounded-full bg-saffron-500" />
                      </div>
                    )}
                    {visible
                      .filter((a) => a.start.startsWith(d))
                      .map((a) => {
                        const s = serviceById(a.serviceId)!;
                        const h = Number(a.start.slice(11, 13)) + Number(a.start.slice(14, 16)) / 60;
                        const color = staffColor[a.staffId];
                        return (
                          <button
                            key={a.id}
                            onClick={() => setOpen(a)}
                            className={cn(
                              "absolute inset-x-1 flex flex-col justify-start overflow-hidden rounded-lg border-l-[3px] px-2 py-1 text-left text-[12px] leading-tight transition-[filter] hover:brightness-125",
                              a.status === "completed" && "opacity-75",
                              a.status === "no-show" && "opacity-75 line-through",
                            )}
                            style={{
                              top: (h - START_H) * ROW + 1,
                              height: Math.max(26, (s.durationMin / 60) * ROW - 2),
                              borderColor: color,
                              background: `color-mix(in oklab, ${color} 18%, #161429)`,
                            }}
                          >
                            <div className="truncate font-medium text-fg">{customerById(a.customerId)?.name}</div>
                            <div className={cn("truncate text-fg-2", s.durationMin < 40 && "hidden")}>
                              {formatTime(a.start)} {s.name}
                            </div>
                            {a.status === "awaiting-deposit" && <IndianRupee className="absolute top-1 right-1 size-3 text-saffron-400" />}
                          </button>
                        );
                      })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <Drawer open={!!open} onClose={() => setOpen(null)} title="Appointment">
        {open && <AppointmentDetail a={open} onStatus={setStatus} />}
      </Drawer>

      <NewAppointment
        open={creating}
        onClose={() => setCreating(false)}
        existing={appts}
        onCreate={(a) => {
          setAppts((all) => [...all, a]);
          setWeekStart(mondayOf(a.start.slice(0, 10)));
          setCreating(false);
          toast(`Booked. Confirmation sent to ${customerById(a.customerId)?.name} on WhatsApp.`);
        }}
      />
    </>
  );
}

function AppointmentDetail({ a, onStatus }: { a: Appointment; onStatus: (id: string, s: AppointmentStatus, msg: string) => void }) {
  const s = serviceById(a.serviceId)!;
  const c = customerById(a.customerId)!;
  const toast = useToast();
  const biz = getBusiness();
  const depositRequest = useMemo(
    () => ({ upiId: biz.upiId, payeeName: biz.name, amountINR: a.depositINR ?? 0, note: `Deposit: ${s.name}, ${formatDay(a.start)}`, ref: a.id }),
    [biz, a, s],
  );
  return (
    <div className="space-y-6">
      <div>
        <Badge tone={apptMeta[a.status].tone} dot>
          {apptMeta[a.status].label}
        </Badge>
        <h3 className="display mt-3 text-[34px]">{s.name}</h3>
        <p className="mt-1 text-fg-2">
          {formatDay(a.start)}, {formatTime(a.start)} · {s.durationMin} min with {staffById(a.staffId)?.name}
        </p>
      </div>
      <dl className="divide-y divide-line rounded-2xl ring-1 ring-line">
        {[
          ["Customer", c.name],
          ["Phone", c.phone],
          ["Price", formatINR(s.priceINR)],
          ["Booked via", a.source === "whatsapp" ? "WhatsApp (Reppy)" : a.source === "call" ? "Phone call (Reppy)" : "Dashboard"],
          ...(a.depositINR ? [["Deposit", `${formatINR(a.depositINR)} · ${a.depositPaid ? "paid" : "not received yet"}`]] : []),
          ["Reminders", "24 h and 2 h before, on WhatsApp"],
        ].map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4 px-4 py-3 text-[14px]">
            <dt className="text-fg-3">{k}</dt>
            <dd className="text-right">{v}</dd>
          </div>
        ))}
      </dl>
      {c.notes && <p className="rounded-xl bg-white/[0.03] p-3 text-[13px] text-fg-2 ring-1 ring-line">Note: {c.notes}</p>}
      <div className="grid gap-2">
        {a.status === "awaiting-deposit" && a.depositINR && (
          <UpiRequestCard request={depositRequest} />
        )}
        {a.status === "awaiting-deposit" && (
          <>
            <Button onClick={() => onStatus(a.id, "confirmed", "Deposit marked as received. Booking confirmed.")}>I received the {formatINR(a.depositINR ?? 0)} deposit</Button>
            <Button variant="secondary" onClick={() => toast(`UPI link for ${formatINR(a.depositINR ?? 0)} to ${biz.upiId} re-sent`)}>
              Re-send UPI link
            </Button>
          </>
        )}
        {a.status === "confirmed" && (
          <>
            <Button variant="secondary" onClick={() => onStatus(a.id, "completed", "Marked as completed")}>
              Mark as completed
            </Button>
            <Button variant="ghost" onClick={() => onStatus(a.id, "cancelled", `Cancelled. ${c.name.split(" ")[0]} has been told on WhatsApp.`)}>
              Cancel appointment
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

function NewAppointment({
  open,
  onClose,
  existing,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  existing: Appointment[];
  onCreate: (a: Appointment) => void;
}) {
  const services = getServices();
  const customers = getCustomers();
  const [customerId, setCustomerId] = useState(customers[0].id);
  const [serviceId, setServiceId] = useState(services[0].id);
  const service = serviceById(serviceId)!;
  const [staffId, setStaffId] = useState(service.staffIds[0]);
  const [date, setDate] = useState(addDays(DEMO_TODAY, 1));
  const [slot, setSlot] = useState<string | null>(null);

  const validStaff = service.staffIds.includes(staffId) ? staffId : service.staffIds[0];
  const slots = useMemo(() => freeSlots(date, service, validStaff, existing), [date, service, validStaff, existing]);

  return (
    <Modal open={open} onClose={onClose} title="New appointment">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!slot) return;
          onCreate({ id: `ap_${Date.now()}`, businessId: "biz_glow", customerId, serviceId, staffId: validStaff, start: `${date}T${slot}:00`, status: "confirmed", source: "dashboard" });
          setSlot(null);
        }}
      >
        <Field label="Customer">
          <Select value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} · {c.phone}
              </option>
            ))}
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Service">
            <Select
              value={serviceId}
              onChange={(e) => {
                setServiceId(e.target.value);
                setSlot(null);
              }}
            >
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} · {formatINR(s.priceINR)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="With">
            <Select
              value={validStaff}
              onChange={(e) => {
                setStaffId(e.target.value);
                setSlot(null);
              }}
            >
              {service.staffIds.map((id) => (
                <option key={id} value={id}>
                  {staffById(id)?.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="Date">
          <Input
            type="date"
            value={date}
            min={DEMO_TODAY}
            onChange={(e) => {
              setDate(e.target.value);
              setSlot(null);
            }}
          />
        </Field>
        <div>
          <div className="mb-2 text-[13px] font-medium text-fg-2">Free slots ({service.durationMin} min)</div>
          {slots.length === 0 ? (
            <p className="rounded-xl bg-white/[0.03] p-3 text-[13px] text-fg-3 ring-1 ring-line">
              No free slots — the salon is closed, {staffById(validStaff)?.name} is off, or the day is full. Try another date.
            </p>
          ) : (
            <div className="scroll-thin flex max-h-36 flex-wrap gap-2 overflow-y-auto">
              {slots.map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => setSlot(t)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-[13px] tabular-nums ring-1 transition-colors",
                    slot === t ? "bg-violet-600 text-white ring-violet-500" : "text-fg-2 ring-line hover:bg-white/5",
                  )}
                >
                  {formatTime(`${date}T${t}:00`)}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!slot}>
            Book and send confirmation
          </Button>
        </div>
      </form>
    </Modal>
  );
}
