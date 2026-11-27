import type { DailyVolume } from "@/lib/mock/data";
import type { Appointment, Business, ChangeLogEntry, Conversation, Customer, Faq, KnowledgeGap, ReceptionistConfig, Service, Staff } from "@/lib/types";

/**
 * Everything the dashboard shows, loaded once per page view.
 * "sample" = the made-up Glow Studio data (signed out).
 * "live"   = the signed-in owner's real business from the database.
 */
export interface DashboardData {
  mode: "sample" | "live";
  today: string; // YYYY-MM-DD in India time
  slug: string; // for the chat link
  business: Business;
  staff: Staff[];
  services: Service[];
  customers: Customer[];
  conversations: Conversation[];
  appointments: Appointment[];
  knowledgeGaps: KnowledgeGap[];
  changeLog: ChangeLogEntry[];
  faqs: Faq[];
  receptionist: ReceptionistConfig;
  dailyVolume: DailyVolume[];
  peakHours: number[][];
  topQuestions: { q: string; count: number; unanswered?: boolean }[];
  usage: { repliesToday: number; dailyCap: number };
}
