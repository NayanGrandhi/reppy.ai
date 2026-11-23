// The "business brain": everything Reppy is allowed to tell customers.
// One shape is used by the extractor (Claude fills it in), the review page
// (the owner fixes it), the database and the chat (Claude answers from it).
import { z } from "zod";

export const BUSINESS_TYPES = [
  "Salon",
  "Clinic",
  "Restaurant",
  "Coaching",
  "Real estate",
  "Gym",
  "Repair shop",
  "Other",
] as const;

export const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;

// Note: structured outputs don't support min/max constraints, so the schema
// stays simple and "unknown" is expressed with null instead of guessing.
export const BrainSchema = z.object({
  name: z.string().describe("Business name exactly as written by the business"),
  type: z.enum(BUSINESS_TYPES).describe("Closest business type; 'Other' if nothing fits"),
  description: z.string().describe("One plain sentence about what the business does; empty if unknown"),
  address: z.string().describe("Full address; empty if unknown"),
  city: z.string().describe("City; empty if unknown"),
  phone: z.string().describe("Business phone number; empty if unknown"),
  website: z.string().describe("Website URL; empty if unknown"),
  languages: z.array(z.string()).describe("Languages the business serves customers in"),
  hours: z
    .array(
      z.object({
        day: z.enum(DAYS),
        open: z.string().describe("24h HH:MM, empty if closed or unknown"),
        close: z.string().describe("24h HH:MM, empty if closed or unknown"),
        closed: z.boolean(),
      }),
    )
    .describe("One entry per day the sources mention. Leave out days that aren't mentioned."),
  services: z.array(
    z.object({
      name: z.string(),
      category: z.string().describe("Group such as Hair, Skin, Consultation; empty if none"),
      priceINR: z.number().nullable().describe("Price in rupees. null if not stated. Never estimate."),
      priceNote: z.string().describe("Extra price detail such as 'starts at' or 'per session'; empty if none"),
      durationMin: z.number().nullable().describe("Minutes. null if not stated."),
      staff: z.array(z.string()).describe("Names of staff who do this service, if stated"),
    }),
  ),
  staff: z.array(
    z.object({
      name: z.string(),
      role: z.string(),
      offDays: z.array(z.enum(DAYS)),
    }),
  ),
  policies: z.array(z.string()).describe("Cancellation, deposit, late arrival, payment and similar rules"),
  faqs: z.array(z.object({ q: z.string(), a: z.string() })),
  bookingRules: z.object({
    bufferMin: z.number().nullable().describe("Gap between appointments in minutes; null if not stated"),
    depositINR: z.number().nullable().describe("Booking deposit in rupees; null if none stated"),
    notes: z.string().describe("Any other booking rule; empty if none"),
  }),
  customFields: z
    .array(z.object({ label: z.string().describe("What Reppy should ask, e.g. 'Car model and year'") }))
    .describe("Questions Reppy should ask customers before booking"),
  upiId: z.string().describe("UPI ID for deposits; empty if unknown"),
});

export type Brain = z.infer<typeof BrainSchema>;

export const MissingSchema = z.object({
  field: z.string().describe("Which part is missing or unclear, in plain words"),
  why: z.string().describe("Why it matters for answering customers, one short sentence"),
});
export type Missing = z.infer<typeof MissingSchema>;

export const ExtractionSchema = z.object({
  brain: BrainSchema,
  missing: z.array(MissingSchema).describe("Important things the sources didn't cover or that conflict"),
});
export type Extraction = z.infer<typeof ExtractionSchema>;

export interface StoredBrain {
  slug: string;
  brain: Brain;
  isDemo: boolean;
  updatedAt: string;
}

export const emptyBrain = (): Brain => ({
  name: "",
  type: "Other",
  description: "",
  address: "",
  city: "",
  phone: "",
  website: "",
  languages: ["English", "Hindi", "Hinglish"],
  hours: [],
  services: [],
  staff: [],
  policies: [],
  faqs: [],
  bookingRules: { bufferMin: null, depositINR: null, notes: "" },
  customFields: [],
  upiId: "",
});

export function slugify(name: string) {
  const base = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return base || "business";
}
