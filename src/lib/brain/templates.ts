// Industry templates. Each one tells the extractor what to look for, what
// counts as "missing", and which questions Reppy should ask before booking.
// Adding an industry = adding an entry here.
import type { Brain } from "./schema";

export interface Template {
  type: Brain["type"];
  staffWord: string; // "stylist", "doctor"…
  mustHave: string[]; // checked on the review page
  defaultCustomFields: string[];
  extraRules: string[]; // added to the chat system prompt
}

export const templates: Record<Brain["type"], Template> = {
  Salon: {
    type: "Salon",
    staffWord: "stylist",
    mustHave: ["services with prices", "service durations", "opening hours", "staff"],
    defaultCustomFields: [],
    extraRules: ["If a customer asks for a specific stylist, only offer that stylist's services."],
  },
  Clinic: {
    type: "Clinic",
    staffWord: "doctor",
    mustHave: ["consultation fee", "doctor timings", "opening hours", "doctors"],
    defaultCustomFields: ["New or returning patient"],
    extraRules: [
      "Never give medical advice, diagnoses, dosages or opinions on symptoms, even if asked directly. Say you can't give medical advice and offer an appointment.",
      "If the customer mentions an emergency, severe pain, breathing difficulty, chest pain, heavy bleeding or loss of consciousness: tell them to call 112 or go to the nearest emergency room right now, and mark it as a handoff.",
      "Collect only the minimum health detail needed to book (for example 'follow-up' or 'fever'). Don't ask for more.",
    ],
  },
  Restaurant: {
    type: "Restaurant",
    staffWord: "staff member",
    mustHave: ["menu or popular dishes with prices", "opening hours", "table booking rules"],
    defaultCustomFields: ["Number of guests"],
    extraRules: ["Don't promise a table is free unless the owner has confirmed. Collect name, guests and time."],
  },
  Coaching: {
    type: "Coaching",
    staffWord: "teacher",
    mustHave: ["courses with fees", "batch timings", "demo class rules"],
    defaultCustomFields: ["Student's class or grade"],
    extraRules: [],
  },
  "Real estate": {
    type: "Real estate",
    staffWord: "agent",
    mustHave: ["property types and areas", "price ranges", "site visit timings"],
    defaultCustomFields: ["Budget range", "Preferred area"],
    extraRules: ["Never promise prices, availability or legal status beyond what's in the business brain."],
  },
  Gym: {
    type: "Gym",
    staffWord: "trainer",
    mustHave: ["membership plans with prices", "opening hours", "trial rules"],
    defaultCustomFields: ["Fitness goal"],
    extraRules: ["Don't give medical or injury advice."],
  },
  "Repair shop": {
    type: "Repair shop",
    staffWord: "technician",
    mustHave: ["services with prices or starting prices", "opening hours", "pick-up rules"],
    defaultCustomFields: ["Model and year of the item"],
    extraRules: ["Only quote prices that are in the business brain; say final cost needs an inspection."],
  },
  Other: {
    type: "Other",
    staffWord: "team member",
    mustHave: ["services or products with prices", "opening hours"],
    defaultCustomFields: [],
    extraRules: [],
  },
};

/** What's still missing, checked on our side (independent of what Claude flagged). */
export function checkCompleteness(b: Brain): string[] {
  const gaps: string[] = [];
  if (!b.name.trim()) gaps.push("Business name");
  if (b.services.length === 0) gaps.push("Services");
  const noPrice = b.services.filter((s) => s.priceINR === null && !s.priceNote).length;
  if (noPrice) gaps.push(`${noPrice} service${noPrice > 1 ? "s" : ""} without a price`);
  const noDur = b.services.filter((s) => s.durationMin === null).length;
  if (noDur && b.type !== "Restaurant" && b.type !== "Real estate") gaps.push(`${noDur} service${noDur > 1 ? "s" : ""} without a duration`);
  if (b.hours.length === 0) gaps.push("Opening hours");
  else if (b.hours.length < 7) gaps.push(`Hours for ${7 - b.hours.length} day${7 - b.hours.length > 1 ? "s" : ""}`);
  if (!b.address.trim()) gaps.push("Address");
  return gaps;
}
