// Sample businesses for the chat demo and the database seed.
import type { Brain, StoredBrain } from "./schema";

const glow: Brain = {
  name: "Glow Studio",
  type: "Salon",
  description: "A hair, skin and nails salon in Bandra West, Mumbai.",
  address: "14 Hill Road, Bandra West, Mumbai 400050",
  city: "Mumbai",
  phone: "+91 98200 41177",
  website: "",
  languages: ["English", "Hindi", "Hinglish"],
  hours: [
    { day: "Monday", open: "10:00", close: "20:00", closed: false },
    { day: "Tuesday", open: "", close: "", closed: true },
    { day: "Wednesday", open: "10:00", close: "20:00", closed: false },
    { day: "Thursday", open: "10:00", close: "20:00", closed: false },
    { day: "Friday", open: "10:00", close: "21:00", closed: false },
    { day: "Saturday", open: "09:00", close: "21:00", closed: false },
    { day: "Sunday", open: "10:00", close: "18:00", closed: false },
  ],
  services: [
    { name: "Haircut (women)", category: "Hair", priceINR: 700, priceNote: "", durationMin: 45, staff: ["Anita", "Rahul"] },
    { name: "Haircut (men)", category: "Hair", priceINR: 400, priceNote: "", durationMin: 30, staff: ["Anita", "Rahul"] },
    { name: "Global hair colour", category: "Hair", priceINR: 3200, priceNote: "", durationMin: 120, staff: ["Anita"] },
    { name: "Keratin treatment", category: "Hair", priceINR: 5500, priceNote: "", durationMin: 150, staff: ["Anita"] },
    { name: "Blow-dry", category: "Hair", priceINR: 500, priceNote: "", durationMin: 30, staff: ["Anita", "Rahul"] },
    { name: "Hydra facial", category: "Skin", priceINR: 2400, priceNote: "", durationMin: 60, staff: ["Meera"] },
    { name: "Clean-up", category: "Skin", priceINR: 900, priceNote: "", durationMin: 40, staff: ["Meera"] },
    { name: "Gel manicure", category: "Nails", priceINR: 1200, priceNote: "", durationMin: 50, staff: ["Meera"] },
    { name: "Bridal trial", category: "Bridal", priceINR: 4500, priceNote: "Saree draping included", durationMin: 120, staff: ["Anita", "Meera"] },
  ],
  staff: [
    { name: "Anita", role: "Senior stylist", offDays: ["Tuesday"] },
    { name: "Rahul", role: "Stylist", offDays: ["Wednesday"] },
    { name: "Meera", role: "Skin and nails", offDays: ["Thursday"] },
  ],
  policies: [
    "₹200 deposit for bridal and keratin bookings, adjusted in the final bill",
    "Free reschedule up to 3 hours before the appointment",
    "Late by more than 15 minutes may need a new slot",
    "Card, UPI and cash accepted",
  ],
  faqs: [
    { q: "Do I need an appointment?", a: "Walk-ins are welcome when a stylist is free, but booking guarantees your slot." },
    { q: "Which hair colour brands do you use?", a: "L'Oréal Professionnel and Schwarzkopf. Ammonia-free options are available." },
    { q: "Do you do home visits?", a: "Only for bridal bookings within Bandra, Khar and Santacruz." },
  ],
  bookingRules: { bufferMin: 10, depositINR: 200, notes: "Deposit only for bridal and keratin." },
  customFields: [],
  upiId: "glowstudio@okhdfcbank",
};

const mehta: Brain = {
  name: "Mehta Family Clinic",
  type: "Clinic",
  description: "A family medicine clinic for adults and children in Baner, Pune.",
  address: "Shop 3, Sai Plaza, Baner Road, Pune 411045",
  city: "Pune",
  phone: "+91 98220 55190",
  website: "",
  languages: ["English", "Hindi", "Hinglish", "Marathi"],
  hours: [
    { day: "Monday", open: "09:30", close: "20:00", closed: false },
    { day: "Tuesday", open: "09:30", close: "20:00", closed: false },
    { day: "Wednesday", open: "09:30", close: "20:00", closed: false },
    { day: "Thursday", open: "09:30", close: "20:00", closed: false },
    { day: "Friday", open: "09:30", close: "20:00", closed: false },
    { day: "Saturday", open: "09:30", close: "14:00", closed: false },
    { day: "Sunday", open: "", close: "", closed: true },
  ],
  services: [
    { name: "General consultation", category: "Consultation", priceINR: 600, priceNote: "", durationMin: 15, staff: ["Dr. Arvind Mehta", "Dr. Kavita Rao"] },
    { name: "Child consultation", category: "Consultation", priceINR: 600, priceNote: "", durationMin: 15, staff: ["Dr. Kavita Rao"] },
    { name: "Follow-up visit (within 7 days)", category: "Consultation", priceINR: 300, priceNote: "", durationMin: 10, staff: ["Dr. Arvind Mehta", "Dr. Kavita Rao"] },
    { name: "Annual health check-up", category: "Packages", priceINR: 2499, priceNote: "Includes blood tests; fasting needed", durationMin: 45, staff: ["Dr. Arvind Mehta"] },
    { name: "Vaccination (child)", category: "Vaccination", priceINR: null, priceNote: "Depends on the vaccine", durationMin: 10, staff: ["Dr. Kavita Rao"] },
  ],
  staff: [
    { name: "Dr. Arvind Mehta", role: "General physician (MBBS, MD)", offDays: ["Sunday"] },
    { name: "Dr. Kavita Rao", role: "Paediatrician (MBBS, DCH)", offDays: ["Thursday", "Sunday"] },
  ],
  policies: [
    "Please arrive 10 minutes early for your first visit",
    "Follow-up within 7 days is charged at ₹300",
    "UPI, card and cash accepted",
    "For emergencies, call 112 or go to the nearest hospital",
  ],
  faqs: [
    { q: "Do you take walk-ins?", a: "Yes, but patients with appointments are seen first." },
    { q: "Is there parking?", a: "Two-wheeler parking in front of Sai Plaza; car parking on Baner Road." },
  ],
  bookingRules: { bufferMin: 5, depositINR: null, notes: "" },
  customFields: [{ label: "New or returning patient" }],
  upiId: "mehtaclinic@okicici",
};

export const demoBrains: StoredBrain[] = [
  { slug: "glow-studio", brain: glow, isDemo: true, updatedAt: "2026-11-23T00:00:00Z" },
  { slug: "mehta-family-clinic", brain: mehta, isDemo: true, updatedAt: "2026-11-23T00:00:00Z" },
];
