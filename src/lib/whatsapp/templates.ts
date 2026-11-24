// WhatsApp message templates, ready to submit to Meta for approval.
// Template messages are the only messages a business may START (or send after
// the 24-hour reply window). All of these are "utility": tied to something the
// customer did (a booking, a missed call) or meant for the owner. None promote
// anything, so Meta shouldn't reclassify them as marketing (₹0.8631 vs ₹0.115).
//
// Variables are numbered {{1}}, {{2}}… as Meta requires. Each template has an
// English and a Hindi version; Hinglish customers get the English one with
// Reppy's own replies in Hinglish (Meta has no Hinglish language code).

export type TemplateLanguage = "en" | "hi";

export interface WhatsAppTemplate {
  /** Meta template name: lowercase, numbers and underscores only */
  name: string;
  category: "UTILITY";
  /** Who receives it */
  audience: "customer" | "owner";
  /** When Reppy sends it */
  trigger: string;
  /** What each variable holds, in order */
  variables: string[];
  body: Record<TemplateLanguage, string>;
  /** Example values Meta asks for when reviewing (one per variable) */
  example: string[];
  /** Optional quick-reply buttons (max 3, max 20 characters each) */
  buttons?: Record<TemplateLanguage, string[]>;
  footer?: Record<TemplateLanguage, string>;
}

const STOP_FOOTER = { en: "Reply STOP to opt out", hi: "संदेश बंद करने के लिए STOP लिखें" };

export const templates: WhatsAppTemplate[] = [
  {
    name: "booking_confirmation",
    category: "UTILITY",
    audience: "customer",
    trigger: "A booking is created or rescheduled (sent even inside the 24-hour window, so the customer has a clear record).",
    variables: ["customer name", "service", "date and time", "staff member", "business name"],
    body: {
      en: "Hi {{1}}, your {{2}} on {{3}} with {{4}} at {{5}} is booked. We'll remind you a day before and 2 hours before.",
      hi: "नमस्ते {{1}}, {{5}} में आपकी {{2}} की बुकिंग {{3}} को {{4}} के साथ हो गई है। हम एक दिन पहले और 2 घंटे पहले याद दिलाएँगे।",
    },
    example: ["Neha", "Global hair colour", "Wed 25 Nov, 11:00 am", "Anita", "Glow Studio"],
    buttons: { en: ["Reschedule", "Cancel"], hi: ["समय बदलें", "रद्द करें"] },
    footer: STOP_FOOTER,
  },
  {
    name: "appointment_reminder_24h",
    category: "UTILITY",
    audience: "customer",
    trigger: "24 hours before a confirmed appointment.",
    variables: ["customer name", "service", "time", "business name", "address"],
    body: {
      en: "Reminder: {{1}}, your {{2}} at {{4}} is tomorrow at {{3}}. Address: {{5}}. Need to change it? Tap below.",
      hi: "याद दिलाना: {{1}}, {{4}} में आपकी {{2}} कल {{3}} बजे है। पता: {{5}}। समय बदलना हो तो नीचे टैप करें।",
    },
    example: ["Neha", "Global hair colour", "11:00 am", "Glow Studio", "14 Hill Road, Bandra West"],
    buttons: { en: ["I'll be there", "Reschedule"], hi: ["मैं आऊँगी/आऊँगा", "समय बदलें"] },
    footer: STOP_FOOTER,
  },
  {
    name: "appointment_reminder_2h",
    category: "UTILITY",
    audience: "customer",
    trigger: "2 hours before a confirmed appointment.",
    variables: ["customer name", "service", "time", "business name"],
    body: {
      en: "See you soon, {{1}}! Your {{2}} at {{4}} is at {{3}} today.",
      hi: "जल्द मिलते हैं, {{1}}! {{4}} में आपकी {{2}} आज {{3}} बजे है।",
    },
    example: ["Neha", "Global hair colour", "11:00 am", "Glow Studio"],
    footer: STOP_FOOTER,
  },
  {
    name: "deposit_request",
    category: "UTILITY",
    audience: "customer",
    trigger: "A booking needs a deposit. The message carries the UPI payment link.",
    variables: ["customer name", "amount", "service", "date and time", "UPI payment link"],
    body: {
      en: "Hi {{1}}, to hold your {{3}} on {{4}}, please pay a deposit of {{2}} by UPI: {{5}} It's adjusted in your final bill.",
      hi: "नमस्ते {{1}}, {{4}} को आपकी {{3}} पक्की करने के लिए कृपया {{2}} की जमा राशि UPI से भेजें: {{5}} यह आपके अंतिम बिल में जोड़ दी जाएगी।",
    },
    example: ["Sneha", "₹200", "Keratin treatment", "Sun 29 Nov, 10:30 am", "upi://pay?pa=glowstudio@okhdfcbank&am=200.00&cu=INR"],
    footer: STOP_FOOTER,
  },
  {
    name: "missed_call_followup",
    category: "UTILITY",
    audience: "customer",
    trigger: "A customer's call was missed, they haven't opted out, and they have messaged this business before.",
    variables: ["business name"],
    body: {
      en: "Sorry we missed your call to {{1}}. I'm Reppy, the AI assistant. Reply here and I'll help with bookings, prices or timings.",
      hi: "माफ़ कीजिए, {{1}} आपकी कॉल नहीं उठा पाया। मैं Reppy हूँ, AI सहायक। यहाँ जवाब दें, मैं बुकिंग, रेट या समय में मदद करूँगी।",
    },
    example: ["Glow Studio"],
    footer: STOP_FOOTER,
  },
  {
    name: "owner_daily_report",
    category: "UTILITY",
    audience: "owner",
    trigger: "Every evening at the owner's chosen time.",
    variables: ["business name", "conversations", "bookings", "missed calls recovered", "estimated revenue", "top question", "items needing the owner"],
    body: {
      en: "Your day at {{1}}: {{2}} conversations, {{3}} bookings, {{4}} missed calls recovered. Estimated revenue booked: {{5}} (from booked services). Top question: {{6}}. Needs you: {{7}}. Reply here to see details.",
      hi: "आज {{1}} में: {{2}} बातचीत, {{3}} बुकिंग, {{4}} मिस्ड कॉल वापस जुड़ीं। बुक हुई सेवाओं से अनुमानित कमाई: {{5}}। सबसे ज़्यादा पूछा गया: {{6}}। आपके लिए: {{7}}। विवरण के लिए यहाँ जवाब दें।",
    },
    example: ["Glow Studio", "46", "17", "4", "₹29,600", "haircut prices", "call back Sameer"],
  },
  {
    name: "owner_question",
    category: "UTILITY",
    audience: "owner",
    trigger: "Reppy didn't know an answer and the owner hasn't messaged in 24 hours (otherwise it's a normal reply).",
    variables: ["customer's question", "customer name"],
    body: {
      en: "A customer asked something I don't know yet: \"{{1}}\" ({{2}}). Reply with the answer and I'll tell them and remember it.",
      hi: "एक ग्राहक ने ऐसा सवाल पूछा जो मुझे नहीं पता: \"{{1}}\" ({{2}})। जवाब भेजें, मैं उन्हें बता दूँगी और याद रखूँगी।",
    },
    example: ["Is parking available near the salon?", "Arjun"],
  },
  {
    name: "owner_alert",
    category: "UTILITY",
    audience: "owner",
    trigger: "A customer is upset, asks for a person, or mentions an emergency.",
    variables: ["customer name", "phone", "reason"],
    body: {
      en: "Needs you now: {{1}} ({{2}}). {{3}} Please call or reply to them soon.",
      hi: "अभी ध्यान दें: {{1}} ({{2}})। {{3}} कृपया जल्द कॉल या जवाब दें।",
    },
    example: ["Sameer Joshi", "+91 99201 48857", "Upset about a long wait and asked for the owner."],
  },
];

/** Fills a template's variables, e.g. for previews and tests. */
export function renderTemplate(t: WhatsAppTemplate, lang: TemplateLanguage, values: string[]): string {
  return t.body[lang].replace(/\{\{(\d+)\}\}/g, (_, n) => values[Number(n) - 1] ?? `{{${n}}}`);
}

/** Meta's rules, checked locally before submitting. Returns problems (empty = ok). */
export function lintTemplate(t: WhatsAppTemplate): string[] {
  const problems: string[] = [];
  if (!/^[a-z0-9_]{1,512}$/.test(t.name)) problems.push("name must be lowercase letters, numbers and underscores");
  for (const lang of Object.keys(t.body) as TemplateLanguage[]) {
    const body = t.body[lang];
    if (body.length > 1024) problems.push(`${lang}: body over 1,024 characters`);
    const nums = [...body.matchAll(/\{\{(\d+)\}\}/g)].map((m) => Number(m[1]));
    const unique = [...new Set(nums)].sort((a, b) => a - b);
    if (unique.some((n, i) => n !== i + 1)) problems.push(`${lang}: variables must run {{1}}, {{2}}… with no gaps`);
    if (unique.length !== t.variables.length) problems.push(`${lang}: uses ${unique.length} variables, ${t.variables.length} described`);
    if (/^\s*\{\{\d+\}\}|\{\{\d+\}\}\s*$/.test(body.replace(/[.!?।]+$/, ""))) problems.push(`${lang}: can't start or end with a variable`);
    if (/\{\{\d+\}\}\s*\{\{\d+\}\}/.test(body)) problems.push(`${lang}: two variables side by side`);
    if (/\b(offer|discount|sale|% off|free gift|limited time|deal)\b/i.test(body)) problems.push(`${lang}: promotional words make Meta treat it as marketing`);
    const buttons = t.buttons?.[lang] ?? [];
    if (buttons.length > 3) problems.push(`${lang}: more than 3 quick replies`);
    for (const b of buttons) if (b.length > 20) problems.push(`${lang}: button "${b}" over 20 characters`);
    if ((t.footer?.[lang]?.length ?? 0) > 60) problems.push(`${lang}: footer over 60 characters`);
  }
  if (t.example.length !== t.variables.length) problems.push("one example value is needed per variable");
  return problems;
}
