// Domain types shared by the UI and (later) the Supabase backend.
// Every record that will live in the database carries a businessId so
// row-level security can keep businesses apart.

export type Channel = "whatsapp" | "call";
export type Language = "English" | "Hindi" | "Hinglish";

export type Intent =
  | "Book appointment"
  | "Reschedule"
  | "Cancel"
  | "Price enquiry"
  | "Timings & location"
  | "Service question"
  | "Complaint"
  | "Emergency"
  | "Other";

export type ConversationStatus =
  | "booked"
  | "answered"
  | "handoff"
  | "recovered" // missed call → WhatsApp follow-up → customer replied
  | "missed"
  | "live";

export interface Message {
  from: "customer" | "reppy" | "owner";
  text: string;
  at: string; // ISO
}

export interface Conversation {
  id: string;
  businessId: string;
  customerId: string;
  channel: Channel;
  startedAt: string;
  durationSec: number;
  status: ConversationStatus;
  intent: Intent;
  language: Language;
  sentiment: "positive" | "neutral" | "negative";
  summary: string;
  followUp?: string;
  messages: Message[];
}

export interface Customer {
  id: string;
  businessId: string;
  name: string;
  phone: string;
  language: Language;
  firstSeen: string;
  visits: number;
  spendINR: number;
  tags: string[];
  notes: string;
  optedIn: boolean;
}

export interface Staff {
  id: string;
  businessId: string;
  name: string;
  role: string;
  offDays: number[]; // 0 = Sunday
}

export interface Service {
  id: string;
  businessId: string;
  name: string;
  category: string;
  priceINR: number;
  durationMin: number;
  staffIds: string[];
}

export type AppointmentStatus = "confirmed" | "awaiting-deposit" | "completed" | "cancelled" | "no-show";

export interface Appointment {
  id: string;
  businessId: string;
  customerId: string;
  serviceId: string;
  staffId: string;
  start: string; // ISO, local time
  status: AppointmentStatus;
  source: Channel | "dashboard";
  depositINR?: number;
  depositPaid?: boolean;
}

export interface KnowledgeGap {
  id: string;
  businessId: string;
  question: string;
  askedBy: string;
  askedAt: string;
  status: "waiting" | "answered";
  answer?: string;
  timesAsked: number;
}

export interface ChangeLogEntry {
  id: string;
  businessId: string;
  at: string;
  by: string;
  via: "WhatsApp" | "Voice note" | "Dashboard";
  description: string;
  undone?: boolean;
}

export interface Faq {
  id: string;
  q: string;
  a: string;
}

export interface OpeningHours {
  day: string;
  open: string;
  close: string;
  closed: boolean;
}

export interface Business {
  id: string;
  name: string;
  type: "Salon" | "Clinic" | "Restaurant" | "Gym" | "Coaching" | "Real estate" | "Repair shop" | "Other";
  owner: string;
  city: string;
  address: string;
  phone: string;
  upiId: string;
  languages: Language[];
  hours: OpeningHours[];
  policies: string[];
  bufferMin: number;
}

export interface ReceptionistConfig {
  name: string;
  voice: string;
  personality: "Warm" | "Crisp" | "Formal";
  greeting: string;
  languages: Language[];
  disclosesAi: boolean;
  escalation: { upset: boolean; asksForHuman: boolean; emergency: boolean; refund: boolean };
  instructions: string;
  missedCallFollowUp: boolean;
  depositForNewCustomers: boolean;
}
