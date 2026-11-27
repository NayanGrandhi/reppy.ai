"use server";
// Changes the owner makes in the dashboard. Each one checks who is signed in
// and runs under row-level security as that owner, so it can only touch their
// own business. The one exception is book_slot(), which runs with the server
// key after we've confirmed the business is theirs.
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ReceptionistSchema } from "@/lib/brain/receptionist";
import { isValidUpiId } from "@/lib/upi";
import { bookingMessages, bookSlot } from "@/lib/server/bookings";
import { ownedBusinessId, toIst } from "@/lib/server/dashboard";
import { createBrain, db, getBrain } from "@/lib/server/store";
import { supabaseAsUser } from "@/lib/supabase/server";
import type { Appointment, AppointmentStatus } from "@/lib/types";

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };

async function owner() {
  const supa = await supabaseAsUser();
  const { data } = await supa.auth.getUser();
  if (!data.user) return null;
  return { supa, user: data.user, businessId: await ownedBusinessId(supa) };
}

const SIGNED_OUT = { ok: false as const, error: "You're signed out. Sign in again." };
const NO_BUSINESS = { ok: false as const, error: "No business on this account yet." };
const SAVE_FAILED = { ok: false as const, error: "Couldn't save. Try again." };

/** Start with a copy of the sample salon, so there's something real to try. */
export async function startWithSample(): Promise<Result> {
  const o = await owner();
  if (!o) return SIGNED_OUT;
  if (o.businessId) return { ok: true };
  if (!db()) return { ok: false, error: "The database key (SUPABASE_SERVICE_ROLE_KEY) isn't added in Vercel yet." };
  const sample = await getBrain("glow-studio");
  if (!sample) return { ok: false, error: "The sample salon is missing from the database." };
  await createBrain({ ...sample.brain }, [], o.user.id);
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}

const BookInput = z.object({
  customerId: z.string().uuid().optional(),
  newCustomer: z.object({ name: z.string().trim().min(1).max(80), phone: z.string().trim().regex(/^\+?[0-9 ]{10,16}$/) }).optional(),
  serviceId: z.string().uuid(),
  staffId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
});

/** Normalises an Indian mobile number to +91XXXXXXXXXX. */
function normalisePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  return `+${digits}`;
}

export async function bookAppointment(input: z.input<typeof BookInput>): Promise<Result<{ appointment: Appointment; customer?: { id: string; name: string; phone: string } }>> {
  const parsed = BookInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Check the customer's name and a 10-digit mobile number." };
  const o = await owner();
  if (!o) return SIGNED_OUT;
  if (!o.businessId) return NO_BUSINESS;
  const { serviceId, staffId, date, time } = parsed.data;

  let customerId = parsed.data.customerId;
  let created: { id: string; name: string; phone: string } | undefined;
  if (!customerId) {
    if (!parsed.data.newCustomer) return { ok: false, error: "Pick a customer or add a new one." };
    const phone = normalisePhone(parsed.data.newCustomer.phone);
    const { data, error } = await o.supa
      .from("customers")
      .upsert({ business_id: o.businessId, name: parsed.data.newCustomer.name, phone }, { onConflict: "business_id,phone" })
      .select("id, name, phone")
      .single();
    if (error || !data) return SAVE_FAILED;
    customerId = data.id as string;
    created = { id: customerId, name: data.name as string, phone: data.phone as string };
  } else {
    // Make sure the customer belongs to this business (RLS hides others).
    const { data } = await o.supa.from("customers").select("id").eq("id", customerId).maybeSingle();
    if (!data) return { ok: false, error: "That customer isn't in your list." };
  }

  const r = await bookSlot({ businessId: o.businessId, customerId, serviceId, staffId, start: `${date}T${time}:00+05:30`, source: "dashboard" });
  if (!r.ok) return { ok: false, error: r.message };
  revalidatePath("/dashboard", "layout");
  return {
    ok: true,
    customer: created,
    appointment: { id: r.id, businessId: o.businessId, customerId, serviceId, staffId, start: toIst(r.startsAt), status: "confirmed", source: "dashboard" },
  };
}

export async function setAppointmentStatus(id: string, status: AppointmentStatus): Promise<Result> {
  if (!z.string().uuid().safeParse(id).success) return SAVE_FAILED;
  const o = await owner();
  if (!o) return SIGNED_OUT;
  const patch: Record<string, unknown> = { status };
  if (status === "confirmed") patch.deposit_paid = true;
  const { data, error } = await o.supa.from("appointments").update(patch).eq("id", id).select("id");
  if (error) return { ok: false, error: error.code === "23P01" ? bookingMessages.slot_taken : "Couldn't update. Try again." };
  if (!data?.length) return SAVE_FAILED;
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}

export async function answerGap(gapId: string, answer: string, question: string): Promise<Result> {
  const a = answer.trim().slice(0, 600);
  if (!a) return { ok: false, error: "Type an answer first." };
  const o = await owner();
  if (!o) return SIGNED_OUT;
  if (!o.businessId) return NO_BUSINESS;
  const { error } = await o.supa.from("knowledge_gaps").update({ status: "answered", answer: a }).eq("id", gapId);
  if (error) return SAVE_FAILED;
  const { error: e2 } = await o.supa.from("faqs").insert({ business_id: o.businessId, question: question.slice(0, 300), answer: a, learned: true, position: 999 });
  if (e2) return SAVE_FAILED;
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}

export async function addFaq(q: string, a: string): Promise<Result<{ id: string }>> {
  if (!q.trim() || !a.trim()) return { ok: false, error: "Add both a question and an answer." };
  const o = await owner();
  if (!o) return SIGNED_OUT;
  if (!o.businessId) return NO_BUSINESS;
  const { data, error } = await o.supa.from("faqs").insert({ business_id: o.businessId, question: q.trim().slice(0, 300), answer: a.trim().slice(0, 600) }).select("id").single();
  if (error || !data) return SAVE_FAILED;
  revalidatePath("/dashboard", "layout");
  return { ok: true, id: data.id as string };
}

export async function updateService(id: string, patch: { priceINR?: number; durationMin?: number }): Promise<Result> {
  const o = await owner();
  if (!o) return SIGNED_OUT;
  const row: Record<string, number> = {};
  if (patch.priceINR !== undefined) {
    if (!Number.isInteger(patch.priceINR) || patch.priceINR < 0 || patch.priceINR > 1_000_000) return { ok: false, error: "Enter a price in whole rupees." };
    row.price_inr = patch.priceINR;
  }
  if (patch.durationMin !== undefined) {
    if (!Number.isInteger(patch.durationMin) || patch.durationMin < 5 || patch.durationMin > 720) return { ok: false, error: "Duration must be 5 to 720 minutes." };
    row.duration_min = patch.durationMin;
  }
  const { data, error } = await o.supa.from("services").update(row).eq("id", id).select("id");
  if (error || !data?.length) return SAVE_FAILED;
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}

export async function saveCustomerNote(id: string, notes: string): Promise<Result> {
  const o = await owner();
  if (!o) return SIGNED_OUT;
  const { data, error } = await o.supa.from("customers").update({ notes: notes.slice(0, 1000) }).eq("id", id).select("id");
  if (error || !data?.length) return SAVE_FAILED;
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}

/** Deletes the customer and their appointments (their right to erasure under DPDP). */
export async function deleteCustomer(id: string): Promise<Result> {
  const o = await owner();
  if (!o) return SIGNED_OUT;
  const { data, error } = await o.supa.from("customers").delete().eq("id", id).select("id");
  if (error || !data?.length) return SAVE_FAILED;
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}

const BizInput = z.object({ name: z.string().trim().min(1).max(120), type: z.string().max(40), address: z.string().max(300) });
export async function saveBusinessDetails(input: z.input<typeof BizInput>): Promise<Result> {
  const p = BizInput.safeParse(input);
  if (!p.success) return { ok: false, error: "Add a business name." };
  const o = await owner();
  if (!o) return SIGNED_OUT;
  if (!o.businessId) return NO_BUSINESS;
  const { error } = await o.supa.from("businesses").update({ ...p.data, updated_at: new Date().toISOString() }).eq("id", o.businessId);
  if (error) return SAVE_FAILED;
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}

export async function saveUpiId(upi: string): Promise<Result> {
  if (!isValidUpiId(upi)) return { ok: false, error: "That doesn't look like a UPI ID (name@bank)." };
  const o = await owner();
  if (!o) return SIGNED_OUT;
  if (!o.businessId) return NO_BUSINESS;
  const { error } = await o.supa.from("businesses").update({ upi_id: upi.trim(), updated_at: new Date().toISOString() }).eq("id", o.businessId);
  if (error) return SAVE_FAILED;
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}

/** AI Receptionist settings. Reppy uses them from the next customer message. */
export async function saveReceptionist(input: unknown): Promise<Result> {
  const o = await owner();
  if (!o) return SIGNED_OUT;
  if (!o.businessId) return NO_BUSINESS;
  const settings = ReceptionistSchema.parse(input ?? {});
  const { error } = await o.supa.from("businesses").update({ receptionist: settings, updated_at: new Date().toISOString() }).eq("id", o.businessId);
  if (error) return SAVE_FAILED;
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}
