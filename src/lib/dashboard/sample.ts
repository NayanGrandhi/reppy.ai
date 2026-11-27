import * as mock from "@/lib/mock/data";
import type { DashboardData } from "./types";

export function sampleDashboard(): DashboardData {
  return {
    mode: "sample",
    today: mock.DEMO_TODAY,
    slug: "glow-studio",
    business: mock.business,
    staff: mock.staff,
    services: mock.services,
    customers: mock.customers,
    conversations: mock.conversations,
    appointments: mock.appointments,
    knowledgeGaps: mock.knowledgeGaps,
    changeLog: mock.changeLog,
    faqs: mock.faqs,
    receptionist: mock.receptionist,
    dailyVolume: mock.dailyVolume,
    peakHours: mock.peakHours,
    topQuestions: mock.topQuestions,
    usage: { repliesToday: 137, dailyCap: 200 },
  };
}
