// UPI payment requests (deep links + QR codes) for deposits.
// Money goes straight to the business's own UPI ID: no gateway, no fees.
// Any UPI app (GPay, PhonePe, Paytm, BHIM…) opens these links.
//
// Format: NPCI "UPI Linking Specification": upi://pay?pa=…&pn=…&am=…&cu=INR&tn=…&tr=…
import QRCode from "qrcode";

export interface UpiRequest {
  /** Payee UPI ID (VPA), e.g. glowstudio@okhdfcbank */
  upiId: string;
  /** Payee name shown in the customer's app */
  payeeName: string;
  /** Amount in rupees */
  amountINR: number;
  /** Short note shown to the customer, e.g. "Deposit: Keratin, Sun 29 Nov" */
  note?: string;
  /** Your reference for matching the payment later, e.g. the booking id */
  ref?: string;
}

const VPA = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z][a-zA-Z0-9.\-]{1,63}$/;

export function isValidUpiId(id: string): boolean {
  return VPA.test(id.trim());
}

export class UpiError extends Error {}

/** Builds a upi://pay link. Throws UpiError for anything a UPI app would reject. */
export function buildUpiLink(req: UpiRequest): string {
  const pa = req.upiId.trim();
  if (!isValidUpiId(pa)) throw new UpiError("That doesn't look like a UPI ID (it should look like name@bank).");
  if (!Number.isFinite(req.amountINR) || req.amountINR <= 0) throw new UpiError("The amount must be more than ₹0.");
  if (req.amountINR > 100000) throw new UpiError("UPI payments are limited to ₹1,00,000 for most people.");
  const pn = req.payeeName.trim().slice(0, 50) || "Payee";
  const params: [string, string][] = [
    ["pa", pa],
    ["pn", pn],
    ["am", req.amountINR.toFixed(2)],
    ["cu", "INR"],
  ];
  if (req.note) params.push(["tn", req.note.trim().slice(0, 80)]);
  if (req.ref) params.push(["tr", req.ref.replace(/[^a-zA-Z0-9\-_]/g, "").slice(0, 35)]);
  // encodeURIComponent keeps '@' readable for pa; UPI apps accept %20 for spaces.
  return `upi://pay?${params.map(([k, v]) => `${k}=${k === "pa" ? v : encodeURIComponent(v)}`).join("&")}`;
}

/** The same request as a scannable QR code (SVG markup). */
export async function upiQrSvg(req: UpiRequest): Promise<string> {
  return QRCode.toString(buildUpiLink(req), { type: "svg", errorCorrectionLevel: "M", margin: 4, color: { dark: "#0c0b1f", light: "#ffffff" } });
}

/** PNG data URL, for places that need an image (e.g. sending on WhatsApp later). */
export async function upiQrDataUrl(req: UpiRequest): Promise<string> {
  return QRCode.toDataURL(buildUpiLink(req), { errorCorrectionLevel: "M", margin: 4, width: 512 });
}
