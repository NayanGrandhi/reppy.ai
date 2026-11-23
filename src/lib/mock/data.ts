// Realistic sample data for "Glow Studio", a salon in Bandra, Mumbai.
// Swap these out for Supabase queries in src/lib/services.ts — the UI never imports this file directly.
import type {
  Appointment,
  Business,
  ChangeLogEntry,
  Conversation,
  Customer,
  Faq,
  KnowledgeGap,
  ReceptionistConfig,
  Service,
  Staff,
} from "../types";

/** Fixed "today" so the demo renders the same on the server and in the browser. */
export const DEMO_TODAY = "2026-11-23";
const B = "biz_glow";

const at = (day: string, time: string) => `${day}T${time}:00`;
const shift = (days: number) => {
  const d = new Date(`${DEMO_TODAY}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

export const business: Business = {
  id: B,
  name: "Glow Studio",
  type: "Salon",
  owner: "Priya Sharma",
  city: "Mumbai",
  address: "14 Hill Road, Bandra West, Mumbai 400050",
  phone: "+91 98200 41177",
  upiId: "glowstudio@okhdfcbank",
  languages: ["English", "Hindi", "Hinglish"],
  bufferMin: 10,
  hours: [
    { day: "Monday", open: "10:00", close: "20:00", closed: false },
    { day: "Tuesday", open: "10:00", close: "20:00", closed: true },
    { day: "Wednesday", open: "10:00", close: "20:00", closed: false },
    { day: "Thursday", open: "10:00", close: "20:00", closed: false },
    { day: "Friday", open: "10:00", close: "21:00", closed: false },
    { day: "Saturday", open: "09:00", close: "21:00", closed: false },
    { day: "Sunday", open: "10:00", close: "18:00", closed: false },
  ],
  policies: [
    "₹200 deposit for bridal and keratin bookings, adjusted in the final bill",
    "Free reschedule up to 3 hours before the appointment",
    "Late by more than 15 minutes may need a new slot",
    "Card, UPI and cash accepted",
  ],
};

export const staff: Staff[] = [
  { id: "st_anita", businessId: B, name: "Anita", role: "Senior stylist", offDays: [2] },
  { id: "st_rahul", businessId: B, name: "Rahul", role: "Stylist", offDays: [3] },
  { id: "st_meera", businessId: B, name: "Meera", role: "Skin & nails", offDays: [4] },
];

export const services: Service[] = [
  { id: "sv_haircut_w", businessId: B, name: "Haircut (women)", category: "Hair", priceINR: 700, durationMin: 45, staffIds: ["st_anita", "st_rahul"] },
  { id: "sv_haircut_m", businessId: B, name: "Haircut (men)", category: "Hair", priceINR: 400, durationMin: 30, staffIds: ["st_anita", "st_rahul"] },
  { id: "sv_color", businessId: B, name: "Global hair colour", category: "Hair", priceINR: 3200, durationMin: 120, staffIds: ["st_anita"] },
  { id: "sv_keratin", businessId: B, name: "Keratin treatment", category: "Hair", priceINR: 5500, durationMin: 150, staffIds: ["st_anita"] },
  { id: "sv_blowdry", businessId: B, name: "Blow-dry", category: "Hair", priceINR: 500, durationMin: 30, staffIds: ["st_anita", "st_rahul"] },
  { id: "sv_facial", businessId: B, name: "Hydra facial", category: "Skin", priceINR: 2400, durationMin: 60, staffIds: ["st_meera"] },
  { id: "sv_cleanup", businessId: B, name: "Clean-up", category: "Skin", priceINR: 900, durationMin: 40, staffIds: ["st_meera"] },
  { id: "sv_mani", businessId: B, name: "Gel manicure", category: "Nails", priceINR: 1200, durationMin: 50, staffIds: ["st_meera"] },
  { id: "sv_bridal", businessId: B, name: "Bridal trial", category: "Bridal", priceINR: 4500, durationMin: 120, staffIds: ["st_anita", "st_meera"] },
];

export const customers: Customer[] = [
  { id: "cu_1", businessId: B, name: "Neha Kapoor", phone: "+91 98191 22034", language: "Hinglish", firstSeen: "2026-03-14", visits: 9, spendINR: 14800, tags: ["Regular", "Colour"], notes: "Prefers Anita. Sensitive scalp — patch test before colour.", optedIn: true },
  { id: "cu_2", businessId: B, name: "Arjun Mehta", phone: "+91 99300 51872", language: "English", firstSeen: "2026-06-02", visits: 4, spendINR: 1600, tags: ["Haircut"], notes: "", optedIn: true },
  { id: "cu_3", businessId: B, name: "Fatima Shaikh", phone: "+91 98670 33419", language: "Hindi", firstSeen: "2026-10-20", visits: 1, spendINR: 2400, tags: ["New"], notes: "Asked about bridal packages for February.", optedIn: true },
  { id: "cu_4", businessId: B, name: "Rohan Iyer", phone: "+91 90040 77812", language: "English", firstSeen: "2025-12-01", visits: 12, spendINR: 5200, tags: ["Regular"], notes: "Every 3 weeks, Saturday mornings.", optedIn: true },
  { id: "cu_5", businessId: B, name: "Sneha Patil", phone: "+91 97690 10455", language: "Hinglish", firstSeen: "2026-08-09", visits: 3, spendINR: 8900, tags: ["Keratin"], notes: "", optedIn: true },
  { id: "cu_6", businessId: B, name: "Kabir Malhotra", phone: "+91 98201 66320", language: "English", firstSeen: "2026-11-21", visits: 0, spendINR: 0, tags: ["New", "Missed call"], notes: "", optedIn: true },
  { id: "cu_7", businessId: B, name: "Pooja Desai", phone: "+91 99870 44102", language: "Hinglish", firstSeen: "2026-01-18", visits: 7, spendINR: 11300, tags: ["Regular", "Nails"], notes: "Birthday 3 Dec — offer gel mani.", optedIn: true },
  { id: "cu_8", businessId: B, name: "Imran Qureshi", phone: "+91 98336 90217", language: "Hindi", firstSeen: "2026-09-05", visits: 2, spendINR: 800, tags: [], notes: "", optedIn: false },
  { id: "cu_9", businessId: B, name: "Ananya Rao", phone: "+91 90829 31146", language: "English", firstSeen: "2026-05-27", visits: 5, spendINR: 9700, tags: ["Facial"], notes: "", optedIn: true },
  { id: "cu_10", businessId: B, name: "Vikram Singh", phone: "+91 97029 58803", language: "Hinglish", firstSeen: "2026-11-02", visits: 1, spendINR: 400, tags: ["New"], notes: "", optedIn: true },
  { id: "cu_11", businessId: B, name: "Divya Nair", phone: "+91 98925 70318", language: "English", firstSeen: "2026-02-11", visits: 6, spendINR: 7400, tags: ["Regular"], notes: "", optedIn: true },
  { id: "cu_12", businessId: B, name: "Sameer Joshi", phone: "+91 99201 48857", language: "Hindi", firstSeen: "2026-07-19", visits: 2, spendINR: 1100, tags: [], notes: "Complained about wait time on 12 Oct.", optedIn: true },
];

const T = DEMO_TODAY;
const Y = shift(-1);
const Y2 = shift(-2);

export const conversations: Conversation[] = [
  {
    id: "cv_101", businessId: B, customerId: "cu_1", channel: "whatsapp", startedAt: at(T, "18:42"), durationSec: 210,
    status: "booked", intent: "Book appointment", language: "Hinglish", sentiment: "positive",
    summary: "Booked global hair colour with Anita on Wed 25 Nov, 11:00. Patch test reminder noted.",
    messages: [
      { from: "customer", text: "Hi, Anita ke saath colour ka slot hai kya is week?", at: at(T, "18:42") },
      { from: "reppy", text: "Hi Neha! Main Reppy hoon, Glow Studio ki AI assistant. Anita ke paas Wed 25 Nov ko 11:00 aur Thu 26 Nov ko 15:30 free hai. Global colour ₹3,200 hai, around 2 hours. Kaunsa chalega?", at: at(T, "18:42") },
      { from: "customer", text: "Wed 11 perfect", at: at(T, "18:44") },
      { from: "reppy", text: "Done ✅ Global hair colour with Anita, Wed 25 Nov at 11:00. Aapke notes mein patch test likha hai — please 15 min pehle aa jaana. Reminder 24 ghante pehle bhejungi.", at: at(T, "18:44") },
    ],
  },
  {
    id: "cv_102", businessId: B, customerId: "cu_6", channel: "call", startedAt: at(T, "17:58"), durationSec: 0,
    status: "recovered", intent: "Price enquiry", language: "English", sentiment: "neutral",
    summary: "Missed call while Reppy was on another line. WhatsApp follow-up sent; customer asked for men's haircut price and booked for tomorrow.",
    followUp: "Confirm Rahul is available Tue — salon is normally closed Tuesdays (special opening).",
    messages: [
      { from: "reppy", text: "Hi, this is Reppy, the AI assistant for Glow Studio. Sorry we missed your call! How can I help? Reply STOP to opt out.", at: at(T, "17:59") },
      { from: "customer", text: "What's the price for a men's haircut?", at: at(T, "18:03") },
      { from: "reppy", text: "A men's haircut is ₹400 and takes about 30 minutes. Would you like me to book one?", at: at(T, "18:03") },
      { from: "customer", text: "Yes, tomorrow evening if possible", at: at(T, "18:05") },
      { from: "reppy", text: "Let me confirm tomorrow's timings with the team and get back to you in a few minutes.", at: at(T, "18:05") },
    ],
  },
  {
    id: "cv_103", businessId: B, customerId: "cu_12", channel: "call", startedAt: at(T, "16:20"), durationSec: 154,
    status: "handoff", intent: "Complaint", language: "Hindi", sentiment: "negative",
    summary: "Customer unhappy about a 40-minute wait last visit and asked to speak to the owner. Owner alerted on WhatsApp.",
    followUp: "Call Sameer back today — he asked for Priya.",
    messages: [
      { from: "reppy", text: "Namaste, Glow Studio mein aapka swagat hai. Main Reppy hoon, ek AI assistant. Main aapki kaise madad kar sakti hoon?", at: at(T, "16:20") },
      { from: "customer", text: "Pichli baar chaalis minute wait karna pada. Mujhe owner se baat karni hai.", at: at(T, "16:20") },
      { from: "reppy", text: "Mujhe bahut afsos hai ki aapko itna intezaar karna pada. Main abhi Priya ji ko message kar rahi hoon, woh aapko jald call karengi.", at: at(T, "16:21") },
    ],
  },
  {
    id: "cv_104", businessId: B, customerId: "cu_4", channel: "whatsapp", startedAt: at(T, "14:05"), durationSec: 95,
    status: "booked", intent: "Reschedule", language: "English", sentiment: "positive",
    summary: "Moved Saturday 10:00 haircut to Saturday 12:30 with Rahul.",
    messages: [
      { from: "customer", text: "Can I move my Saturday cut to after 12?", at: at(T, "14:05") },
      { from: "reppy", text: "Sure, Rohan. Rahul is free at 12:30 or 14:00 on Saturday. Which works?", at: at(T, "14:05") },
      { from: "customer", text: "12:30", at: at(T, "14:06") },
      { from: "reppy", text: "Moved ✅ Men's haircut with Rahul, Sat 28 Nov at 12:30.", at: at(T, "14:06") },
    ],
  },
  {
    id: "cv_105", businessId: B, customerId: "cu_3", channel: "whatsapp", startedAt: at(T, "12:31"), durationSec: 320,
    status: "answered", intent: "Service question", language: "Hindi", sentiment: "neutral",
    summary: "Asked whether bridal trial includes saree draping. Reppy didn't know — asked Priya, saved her answer, replied.",
    messages: [
      { from: "customer", text: "Bridal trial mein saree draping included hai kya?", at: at(T, "12:31") },
      { from: "reppy", text: "Achha sawaal hai! Main team se confirm karke aapko batati hoon.", at: at(T, "12:31") },
      { from: "owner", text: "Haan included hai, 30 min extra lagte hain", at: at(T, "12:36") },
      { from: "reppy", text: "Haan, bridal trial (₹4,500) mein saree draping included hai. Isme lagbhag 30 minute extra lagte hain.", at: at(T, "12:36") },
    ],
  },
  {
    id: "cv_106", businessId: B, customerId: "cu_7", channel: "call", startedAt: at(T, "11:12"), durationSec: 132,
    status: "booked", intent: "Book appointment", language: "Hinglish", sentiment: "positive",
    summary: "Booked gel manicure with Meera, Mon 30 Nov 17:00.",
    messages: [
      { from: "reppy", text: "Hi, Glow Studio! Main Reppy, AI assistant. Kaise help karun?", at: at(T, "11:12") },
      { from: "customer", text: "Gel manicure book karna tha next Monday shaam ko", at: at(T, "11:12") },
      { from: "reppy", text: "Meera Monday 30 Nov ko 17:00 ya 18:00 free hai. Gel manicure ₹1,200 hai.", at: at(T, "11:13") },
      { from: "customer", text: "Paanch baje", at: at(T, "11:13") },
      { from: "reppy", text: "Ho gaya! Monday 30 Nov, 17:00, Meera ke saath. WhatsApp pe confirmation bhej diya hai.", at: at(T, "11:14") },
    ],
  },
  {
    id: "cv_107", businessId: B, customerId: "cu_10", channel: "whatsapp", startedAt: at(T, "10:02"), durationSec: 40,
    status: "answered", intent: "Timings & location", language: "Hinglish", sentiment: "neutral",
    summary: "Shared today's timings and Google Maps location.",
    messages: [
      { from: "customer", text: "aaj kitne baje tak open ho?", at: at(T, "10:02") },
      { from: "reppy", text: "Aaj hum 10:00 se 20:00 tak open hain. Address: 14 Hill Road, Bandra West. Map: maps.app.goo.gl/glowstudio", at: at(T, "10:02") },
    ],
  },
  {
    id: "cv_108", businessId: B, customerId: "cu_5", channel: "whatsapp", startedAt: at(Y, "19:40"), durationSec: 260,
    status: "booked", intent: "Book appointment", language: "Hinglish", sentiment: "positive",
    summary: "Booked keratin treatment; ₹200 deposit requested by UPI link and marked paid by owner.",
    messages: [
      { from: "customer", text: "Keratin ke liye Sunday ka slot?", at: at(Y, "19:40") },
      { from: "reppy", text: "Anita Sunday 29 Nov ko 10:30 free hai. Keratin ₹5,500, approx 2.5 hours. Booking ke liye ₹200 deposit hai jo final bill mein adjust hoga.", at: at(Y, "19:40") },
      { from: "customer", text: "ok book karo", at: at(Y, "19:42") },
      { from: "reppy", text: "Ye raha UPI link: upi://pay?pa=glowstudio@okhdfcbank&am=200 — payment ke baad slot confirm ho jayega.", at: at(Y, "19:42") },
    ],
  },
  {
    id: "cv_109", businessId: B, customerId: "cu_2", channel: "call", startedAt: at(Y, "13:15"), durationSec: 88,
    status: "answered", intent: "Price enquiry", language: "English", sentiment: "neutral",
    summary: "Asked for blow-dry and men's haircut prices.",
    messages: [
      { from: "reppy", text: "Hi, thanks for calling Glow Studio. I'm Reppy, an AI assistant. How can I help?", at: at(Y, "13:15") },
      { from: "customer", text: "How much is a blow-dry?", at: at(Y, "13:15") },
      { from: "reppy", text: "A blow-dry is ₹500 and takes about 30 minutes.", at: at(Y, "13:15") },
    ],
  },
  {
    id: "cv_110", businessId: B, customerId: "cu_8", channel: "call", startedAt: at(Y2, "21:10"), durationSec: 0,
    status: "missed", intent: "Other", language: "Hindi", sentiment: "neutral",
    summary: "Out-of-hours missed call. No WhatsApp follow-up sent — customer has opted out of messages.",
    messages: [],
  },
  {
    id: "cv_111", businessId: B, customerId: "cu_9", channel: "whatsapp", startedAt: at(Y2, "16:48"), durationSec: 140,
    status: "booked", intent: "Book appointment", language: "English", sentiment: "positive",
    summary: "Booked hydra facial with Meera, Wed 25 Nov 16:00.",
    messages: [
      { from: "customer", text: "Hydra facial on Wednesday afternoon?", at: at(Y2, "16:48") },
      { from: "reppy", text: "Meera has 14:00 and 16:00 free on Wed 25 Nov. Hydra facial is ₹2,400 (60 min).", at: at(Y2, "16:48") },
      { from: "customer", text: "4pm please", at: at(Y2, "16:50") },
      { from: "reppy", text: "Booked ✅ Hydra facial with Meera, Wed 25 Nov at 16:00.", at: at(Y2, "16:50") },
    ],
  },
];

const day = (offset: number) => shift(offset);

export const appointments: Appointment[] = [
  { id: "ap_1", businessId: B, customerId: "cu_11", serviceId: "sv_haircut_w", staffId: "st_anita", start: at(day(0), "11:00"), status: "completed", source: "whatsapp" },
  { id: "ap_2", businessId: B, customerId: "cu_2", serviceId: "sv_haircut_m", staffId: "st_rahul", start: at(day(0), "12:30"), status: "completed", source: "call" },
  { id: "ap_3", businessId: B, customerId: "cu_9", serviceId: "sv_cleanup", staffId: "st_meera", start: at(day(0), "15:00"), status: "completed", source: "whatsapp" },
  { id: "ap_4", businessId: B, customerId: "cu_10", serviceId: "sv_haircut_m", staffId: "st_rahul", start: at(day(0), "18:00"), status: "confirmed", source: "whatsapp" },
  { id: "ap_5", businessId: B, customerId: "cu_7", serviceId: "sv_blowdry", staffId: "st_anita", start: at(day(0), "19:00"), status: "confirmed", source: "dashboard" },
  { id: "ap_6", businessId: B, customerId: "cu_1", serviceId: "sv_color", staffId: "st_anita", start: at(day(2), "11:00"), status: "confirmed", source: "whatsapp" },
  { id: "ap_7", businessId: B, customerId: "cu_9", serviceId: "sv_facial", staffId: "st_meera", start: at(day(2), "16:00"), status: "confirmed", source: "whatsapp" },
  { id: "ap_8", businessId: B, customerId: "cu_12", serviceId: "sv_haircut_m", staffId: "st_rahul", start: at(day(3), "17:30"), status: "confirmed", source: "call" },
  { id: "ap_9", businessId: B, customerId: "cu_3", serviceId: "sv_bridal", staffId: "st_anita", start: at(day(4), "14:00"), status: "awaiting-deposit", source: "whatsapp", depositINR: 200, depositPaid: false },
  { id: "ap_10", businessId: B, customerId: "cu_4", serviceId: "sv_haircut_m", staffId: "st_rahul", start: at(day(5), "12:30"), status: "confirmed", source: "whatsapp" },
  { id: "ap_11", businessId: B, customerId: "cu_11", serviceId: "sv_mani", staffId: "st_meera", start: at(day(5), "15:00"), status: "confirmed", source: "call" },
  { id: "ap_12", businessId: B, customerId: "cu_5", serviceId: "sv_keratin", staffId: "st_anita", start: at(day(6), "10:30"), status: "confirmed", source: "whatsapp", depositINR: 200, depositPaid: true },
  { id: "ap_13", businessId: B, customerId: "cu_7", serviceId: "sv_mani", staffId: "st_meera", start: at(day(7), "17:00"), status: "confirmed", source: "call" },
  { id: "ap_14", businessId: B, customerId: "cu_8", serviceId: "sv_haircut_m", staffId: "st_rahul", start: at(day(-1), "13:00"), status: "no-show", source: "call" },
  { id: "ap_15", businessId: B, customerId: "cu_6", serviceId: "sv_haircut_m", staffId: "st_rahul", start: at(day(3), "18:30"), status: "confirmed", source: "whatsapp" },
];

export const knowledgeGaps: KnowledgeGap[] = [
  { id: "kg_1", businessId: B, question: "Do you do head massage with hair spa?", askedBy: "Vikram Singh", askedAt: at(T, "09:41"), status: "waiting", timesAsked: 3 },
  { id: "kg_2", businessId: B, question: "Is parking available near the salon?", askedBy: "Arjun Mehta", askedAt: at(Y, "13:17"), status: "waiting", timesAsked: 5 },
  { id: "kg_3", businessId: B, question: "Bridal trial mein saree draping included hai?", askedBy: "Fatima Shaikh", askedAt: at(T, "12:31"), status: "answered", answer: "Yes, included. Takes about 30 minutes extra.", timesAsked: 2 },
];

export const changeLog: ChangeLogEntry[] = [
  { id: "cl_1", businessId: B, at: at(T, "12:36"), by: "Priya", via: "WhatsApp", description: "Added FAQ: saree draping is included in the bridal trial (+30 min)" },
  { id: "cl_2", businessId: B, at: at(Y, "20:05"), by: "Priya", via: "Voice note", description: "Men's haircut price ₹350 → ₹400" },
  { id: "cl_3", businessId: B, at: at(Y2, "18:30"), by: "Priya", via: "WhatsApp", description: "Rahul is off on Wednesday 2 Dec" },
  { id: "cl_4", businessId: B, at: at(shift(-4), "10:12"), by: "Anita", via: "Dashboard", description: "Keratin treatment duration 120 → 150 min" },
  { id: "cl_5", businessId: B, at: at(shift(-6), "21:44"), by: "Priya", via: "WhatsApp", description: "Closed on Tuesday 10 Nov (Diwali)" },
];

export const faqs: Faq[] = [
  { id: "fq_1", q: "Do I need an appointment?", a: "Walk-ins are welcome when a stylist is free, but booking guarantees your slot." },
  { id: "fq_2", q: "Which hair colour brands do you use?", a: "L'Oréal Professionnel and Schwarzkopf. Ammonia-free options are available." },
  { id: "fq_3", q: "Do you do home visits?", a: "Only for bridal bookings within Bandra, Khar and Santacruz." },
  { id: "fq_4", q: "Is the bridal trial adjustable in the final package?", a: "Yes, the trial fee is adjusted if you book the bridal package within 30 days." },
];

export const receptionist: ReceptionistConfig = {
  name: "Reppy",
  voice: "Aisha · Indian English, warm",
  personality: "Warm",
  greeting: "Hi, thanks for reaching Glow Studio! I'm Reppy, the studio's AI assistant. How can I help you today?",
  languages: ["English", "Hindi", "Hinglish"],
  disclosesAi: true,
  escalation: { upset: true, asksForHuman: true, emergency: true, refund: true },
  instructions:
    "Offer Anita first for colour and bridal. Never promise discounts. If someone asks for a same-day keratin, explain it needs 2.5 hours and suggest the next morning slot.",
  missedCallFollowUp: true,
  depositForNewCustomers: false,
};

// ── Time-series for charts (deterministic so server and client match) ──
function seeded(n: number) {
  let s = n;
  return () => ((s = (s * 9301 + 49297) % 233280) / 233280);
}

export interface DailyVolume {
  date: string;
  whatsapp: number;
  calls: number;
  bookings: number;
  missedRecovered: number;
}

export const dailyVolume: DailyVolume[] = (() => {
  const r = seeded(7);
  return Array.from({ length: 30 }, (_, i) => {
    const date = shift(i - 29);
    const dow = new Date(`${date}T12:00:00`).getDay();
    const weekend = dow === 0 || dow === 6 ? 1.45 : dow === 2 ? 0.35 : 1;
    const ramp = 0.75 + i / 70;
    const whatsapp = Math.round((22 + r() * 12) * weekend * ramp);
    const calls = Math.round((9 + r() * 7) * weekend * ramp);
    const bookings = Math.round((whatsapp + calls) * (0.34 + r() * 0.1));
    const missedRecovered = Math.round(1 + r() * 4 * weekend);
    return { date, whatsapp, calls, bookings, missedRecovered };
  });
})();

/** Conversations by weekday (rows, Mon→Sun) and hour (cols, 9→21) for the last 4 weeks. */
export const peakHours: number[][] = (() => {
  const r = seeded(19);
  const hourShape = [0.3, 0.55, 0.8, 0.9, 0.7, 0.6, 0.65, 0.8, 1, 1, 0.85, 0.55, 0.25];
  const dayShape = [0.9, 0.3, 0.85, 0.9, 1.1, 1.45, 1.2];
  return dayShape.map((d) => hourShape.map((h) => Math.round(h * d * (14 + r() * 6))));
})();

export const topQuestions = [
  { q: "Price of haircut / colour", count: 142 },
  { q: "Today's timings", count: 98 },
  { q: "Slot availability this weekend", count: 87 },
  { q: "Location / directions", count: 61 },
  { q: "Bridal packages", count: 34 },
  { q: "Parking near the salon", count: 5, unanswered: true },
];
