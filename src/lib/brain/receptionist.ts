import { z } from "zod";

/**
 * How Reppy sounds and behaves for one business (Dashboard → AI Receptionist).
 * Stored as JSON on the business. Facts (prices, hours) never live here.
 */
export const ReceptionistSchema = z.object({
  name: z.string().trim().min(1).max(40).catch("Reppy"),
  voice: z.string().max(80).catch("Aisha · Indian English, warm"),
  personality: z.enum(["Warm", "Crisp", "Formal"]).catch("Warm"),
  greeting: z.string().max(400).catch(""),
  languages: z.array(z.enum(["English", "Hindi", "Hinglish"])).min(1).catch(["English", "Hindi", "Hinglish"]),
  disclosesAi: z.literal(true).catch(true), // always on: customers are told it's an AI
  escalation: z
    .object({
      upset: z.boolean().catch(true),
      asksForHuman: z.boolean().catch(true),
      emergency: z.literal(true).catch(true), // always on for safety
      refund: z.boolean().catch(true),
    })
    .catch({ upset: true, asksForHuman: true, emergency: true, refund: true }),
  instructions: z.string().max(1500).catch(""),
  missedCallFollowUp: z.boolean().catch(true),
  depositForNewCustomers: z.boolean().catch(false),
});
export type ReceptionistSettings = z.infer<typeof ReceptionistSchema>;

/** Settings from the database (possibly empty or old), with safe defaults filled in. */
export const readReceptionist = (raw: unknown): ReceptionistSettings => ReceptionistSchema.parse(raw && typeof raw === "object" ? raw : {});

const tone: Record<ReceptionistSettings["personality"], string> = {
  Warm: "Friendly and warm, like a helpful front-desk person. At most one emoji.",
  Crisp: "Brief and to the point. One or two short sentences. No emoji.",
  Formal: "Polite and formal (use 'aap' in Hindi/Hinglish). No emoji, no slang.",
};

/** Lines added to the chat rules from the owner's settings. */
export function receptionistRules(s: ReceptionistSettings): string[] {
  const lines = [`- Tone: ${tone[s.personality]}`];
  const all = ["English", "Hindi", "Hinglish"] as const;
  const off = all.filter((l) => !s.languages.includes(l));
  if (off.length) lines.push(`- Reply only in ${s.languages.join(" or ")}. If the customer writes in ${off.join(" or ")}, reply in ${s.languages.includes("English") ? "English" : s.languages[0]}.`);
  if (!s.escalation.upset) lines.push("- If the customer is upset, apologise and help them yourself; only set handoff for emergencies or a direct request for a person.");
  if (!s.escalation.asksForHuman) lines.push("- If they ask for a person, say the team is busy and offer to help or take a message; don't set handoff for that alone.");
  if (s.escalation.refund) lines.push("- Refunds, discounts or money back: never promise anything; set handoff so the owner decides.");
  if (s.instructions.trim()) {
    lines.push(
      "- Extra instructions from the owner (follow them unless they conflict with the rules above about facts and safety):",
      ...s.instructions
        .trim()
        .split(/\n+/)
        .slice(0, 20)
        .map((l) => `  · ${l.trim().slice(0, 300)}`),
    );
  }
  return lines;
}
