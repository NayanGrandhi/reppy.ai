// Scripted conversations for the landing-page demo. Purely simulated:
// no message is sent and no call is placed.

export type DemoStep = {
  from: "customer" | "reppy" | "owner" | "system";
  text: string;
  /** ms to wait before this line appears */
  wait: number;
  intent?: string;
  fields?: Record<string, string>;
  action?: { kind: "booking" | "upi" | "brain" | "handoff"; title: string; lines: string[] };
  speak?: { lang: string };
};

export type DemoScenario = {
  id: string;
  label: string;
  business: string;
  channel: "whatsapp" | "call" | "owner";
  language: string;
  steps: DemoStep[];
  summary: string;
};

export const scenarios: DemoScenario[] = [
  {
    id: "salon",
    label: "Salon on WhatsApp",
    business: "Glow Studio, Bandra",
    channel: "whatsapp",
    language: "Hinglish",
    summary: "New customer booked a keratin treatment with Anita for Sun 29 Nov, 10:30. ₹200 deposit requested by UPI. Reminders scheduled 24 h and 2 h before.",
    steps: [
      { from: "customer", text: "Hi! Keratin karwana hai, price kya hai?", wait: 600, intent: "Price enquiry" },
      { from: "reppy", text: "Hi! Main Reppy hoon, Glow Studio ki AI assistant 😊 Keratin treatment ₹5,500 hai aur lagbhag 2.5 ghante lagte hain.", wait: 1300, fields: { Service: "Keratin treatment", Price: "₹5,500 (from rate card)" } },
      { from: "customer", text: "Sunday morning ho jayega? Anita se karwana hai", wait: 1800, intent: "Book appointment", fields: { Staff: "Anita", Day: "Sunday 29 Nov" } },
      { from: "reppy", text: "Anita Sunday ko 10:30 free hai. Book kar dun?", wait: 1300, fields: { Slot: "10:30 (checked: free, 10 min buffer)" } },
      { from: "customer", text: "Haan please", wait: 1500 },
      {
        from: "reppy",
        text: "Done ✅ Sunday 29 Nov, 10:30, Anita ke saath. Slot hold karne ke liye ₹200 deposit hai, final bill mein adjust hoga.",
        wait: 1200,
        action: { kind: "booking", title: "Appointment booked", lines: ["Keratin treatment · 150 min", "Sun 29 Nov, 10:30 with Anita", "Reminders: 24 h and 2 h before"] },
      },
      {
        from: "reppy",
        text: "UPI se pay karein: glowstudio@okhdfcbank · ₹200",
        wait: 900,
        action: { kind: "upi", title: "UPI deposit link sent", lines: ["₹200 to glowstudio@okhdfcbank", "Owner confirms when received"] },
      },
    ],
  },
  {
    id: "clinic",
    label: "Clinic phone call",
    business: "Mehta Family Clinic, Pune",
    channel: "call",
    language: "English + Hindi",
    summary: "Parent booked a follow-up for their son with Dr. Mehta, Tue 24 Nov, 18:15. Reppy gave no medical advice and shared the emergency number when asked about high fever.",
    steps: [
      { from: "reppy", text: "Hello, Mehta Family Clinic. I'm Reppy, the clinic's AI assistant. How can I help?", wait: 500, speak: { lang: "en-IN" } },
      { from: "customer", text: "Hi, I need an appointment with Dr. Mehta for my son. Fever ke liye follow-up.", wait: 2600, intent: "Book appointment", fields: { Doctor: "Dr. Mehta", Visit: "Follow-up (child)" } },
      { from: "reppy", text: "Of course. Dr. Mehta has 5:30 or 6:15 this evening, or tomorrow at 11. Which would you like?", wait: 1600, speak: { lang: "en-IN" }, fields: { Options: "Today 17:30, 18:15 · Tomorrow 11:00" } },
      { from: "customer", text: "Kal shaam 6:15 nahi hai? Should I give him paracetamol meanwhile?", wait: 2800 },
      {
        from: "reppy",
        text: "Tomorrow 6:15 pm is free — booked. I'm not able to give medical advice, so please check with the doctor. If the fever is very high or he's struggling to breathe, call 112 right away.",
        wait: 1800,
        speak: { lang: "en-IN" },
        fields: { Slot: "Tue 24 Nov, 18:15" },
        action: { kind: "booking", title: "Appointment booked", lines: ["Follow-up with Dr. Mehta", "Tue 24 Nov, 18:15", "No medical advice given · safety rule"] },
      },
      { from: "customer", text: "Okay, thank you.", wait: 2400 },
      { from: "reppy", text: "You're welcome. I've sent the details on WhatsApp. Take care!", wait: 1200, speak: { lang: "en-IN" } },
    ],
  },
  {
    id: "owner",
    label: "Owner updates by WhatsApp",
    business: "Glow Studio, Bandra",
    channel: "owner",
    language: "Hinglish voice note",
    summary: "Owner changed the men's haircut price by voice note. Reppy repeated it back, waited for YES, updated the business brain and logged the change with one-tap undo.",
    steps: [
      { from: "owner", text: "🎙️ Voice note, 0:06 — “Men's haircut ab 400 ka hai, aur Rahul Wednesday off hai”", wait: 600, intent: "Owner command (verified number)" },
      { from: "reppy", text: "Got it. Two changes:\n1. Men's haircut ₹350 → ₹400\n2. Rahul off on Wed 25 Nov\nReply YES to confirm.", wait: 1600, fields: { "Change 1": "Price ₹350 → ₹400", "Change 2": "Rahul off Wed 25 Nov" } },
      { from: "owner", text: "YES", wait: 1700 },
      {
        from: "reppy",
        text: "Done ✅ Both changes are live. Rahul had 1 booking on Wednesday — Arjun at 5:30. Should I offer him Thursday 5:30 instead?",
        wait: 1400,
        action: { kind: "brain", title: "Business brain updated", lines: ["Men's haircut: ₹400", "Rahul: off Wed 25 Nov", "Logged · Undo available"] },
      },
      { from: "owner", text: "Haan", wait: 1600 },
      { from: "reppy", text: "Messaged Arjun. I'll tell you once he replies.", wait: 1100 },
    ],
  },
];
