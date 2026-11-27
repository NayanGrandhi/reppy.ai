"use client";
import { CheckCircle2, MessageCircle, Plus, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { saveBusinessDetails, saveUpiId } from "@/app/dashboard/actions";
import { TemplateList } from "@/components/dashboard/template-list";
import { UpiRequestCard } from "@/components/upi-request";
import { isValidUpiId } from "@/lib/upi";
import { Panel, PageHeader } from "@/components/dashboard/shell";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Toggle } from "@/components/ui/controls";
import { useToast } from "@/components/ui/toast";
import { useData } from "@/lib/dashboard/context";

const sections = ["Business", "Team & admin numbers", "WhatsApp", "Payments", "Daily report", "Usage limits", "Data & privacy"];

export default function SettingsPage() {
  const { getBusiness, live } = useData();
  const biz = getBusiness();
  const toast = useToast();
  const [name, setName] = useState(biz.name);
  const [type, setType] = useState<string>(biz.type);
  const [address, setAddress] = useState(biz.address);
  const [saving, setSaving] = useState(false);
  // Things that need WhatsApp connected first (Phase 3).
  const later = (sample: string) => toast(live ? "This works once WhatsApp is connected." : sample);
  const [upi, setUpi] = useState(biz.upiId);
  const [report, setReport] = useState(true);
  const [reportTime, setReportTime] = useState("21:30");
  const [cap, setCap] = useState("500");
  const [alertAt, setAlertAt] = useState(true);
  const previewRequest = useMemo(() => ({ upiId: upi, payeeName: biz.name, amountINR: 200, note: "Deposit: test booking" }), [upi, biz.name]);

  const team = live
    ? [{ name: biz.owner || "You", role: "Owner", phone: biz.phone || "Add on WhatsApp setup", verified: true }]
    : [
    { name: "Priya Sharma", role: "Owner", phone: "+91 98200 41177", verified: true },
    { name: "Anita", role: "Staff · can update services", phone: "+91 98191 70022", verified: true },
    { name: "Rahul", role: "Staff · view only", phone: "+91 90044 18391", verified: false },
      ];

  return (
    <>
      <PageHeader title="Settings" description="Your business, who can give Reppy commands, and how much it can spend." />
      <div className="grid gap-8 lg:grid-cols-[200px_1fr]">
        <nav aria-label="Settings sections" className="hidden lg:block">
          <ul className="sticky top-24 space-y-1 text-[14px]">
            {sections.map((s) => (
              <li key={s}>
                <a href={`#${s.replace(/\W+/g, "-").toLowerCase()}`} className="block rounded-lg px-3 py-1.5 text-fg-3 hover:bg-white/[0.04] hover:text-fg">
                  {s}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="max-w-3xl space-y-6">
          <Panel title="Business" className="scroll-mt-24" >
            <div id="business" className="grid gap-4 md:grid-cols-2">
              <Field label="Business name">
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </Field>
              <Field label="Type">
                <Select value={type} onChange={(e) => setType(e.target.value)}>
                  {["Salon", "Clinic", "Restaurant", "Gym", "Coaching", "Real estate", "Repair shop", "Other"].map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </Select>
              </Field>
              <div className="md:col-span-2">
                <Field label="Address">
                  <Input value={address} onChange={(e) => setAddress(e.target.value)} />
                </Field>
              </div>
            </div>
            <div className="mt-5 flex justify-end">
              <Button
                size="sm"
                disabled={saving}
                onClick={async () => {
                  if (live) {
                    setSaving(true);
                    const r = await saveBusinessDetails({ name, type, address });
                    setSaving(false);
                    if (!r.ok) return toast(r.error);
                  }
                  toast("Business details saved");
                }}
              >
                Save business details
              </Button>
            </div>
          </Panel>

          <Panel title="Team & admin numbers" action={<Button size="sm" variant="secondary" onClick={() => later("Verification code sent on WhatsApp")}><Plus className="size-3.5" /> Add number</Button>}>
            <p id="team-admin-numbers" className="mb-4 text-[13.5px] text-fg-3">
              Only these verified numbers can change prices, timings or pause bookings by messaging Reppy. Big changes always need a “YES” to confirm.
            </p>
            <ul className="divide-y divide-line">
              {team.map((t) => (
                <li key={t.phone} className="flex flex-wrap items-center gap-3 py-3">
                  <Avatar name={t.name} size={34} />
                  <div className="min-w-0 flex-1">
                    <div className="text-[14px] font-medium">{t.name}</div>
                    <div className="text-[12.5px] text-fg-3">
                      {t.role} · {t.phone}
                    </div>
                  </div>
                  {t.verified ? (
                    <Badge tone="good">
                      <CheckCircle2 className="size-3" /> Verified
                    </Badge>
                  ) : (
                    <Button size="sm" variant="ghost" onClick={() => later(`Code re-sent to ${t.phone}`)}>
                      Resend code
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="WhatsApp">
            <div id="whatsapp" className="flex flex-wrap items-center gap-4">
              <span className="grid size-11 place-items-center rounded-xl bg-teal-500/12 text-teal-400 ring-1 ring-teal-500/25">
                <MessageCircle className="size-5" />
              </span>
              <div className="flex-1">
                <div className="flex items-center gap-2 text-[14px] font-medium">
                  {live ? "Not connected yet" : "Meta test number"} <Badge tone="warn">{live ? "Coming next" : "Testing"}</Badge>
                </div>
                <div className="text-[13px] text-fg-3">
                  {live
                    ? "Reppy will answer on WhatsApp once it's connected through Meta's WhatsApp Business Platform."
                    : "Connected via WhatsApp Business Platform. Move to your own number after business verification."}
                </div>
              </div>
              <Button variant="secondary" size="sm" onClick={() => later("We'll guide you through Meta business verification")}>
                Connect my number
              </Button>
            </div>
            <div className="mt-6">
              <TemplateList />
            </div>
          </Panel>

          <Panel title="Payments">
            <div id="payments" className="grid items-end gap-4 md:grid-cols-[1fr_auto]">
              <Field label="Your UPI ID" hint="Reppy sends customers a UPI link or QR for deposits. Money goes straight to you — no gateway, no fees from us.">
                <Input value={upi} onChange={(e) => setUpi(e.target.value)} />
              </Field>
              <Button variant="secondary" className="mb-[26px]" disabled={!isValidUpiId(upi)} onClick={async () => {
                  if (live) {
                    const r = await saveUpiId(upi);
                    if (!r.ok) return toast(r.error);
                  }
                  toast(`UPI ID saved: ${upi}`);
                }}>
                Save UPI ID
              </Button>
            </div>
            {!isValidUpiId(upi) && <p className="-mt-3 mb-3 text-[13px] text-bad">A UPI ID looks like name@bank, for example glowstudio@okhdfcbank.</p>}
            <div className="mt-2">
              <div className="mb-2 text-[13px] text-fg-3">Preview: what customers get for a ₹200 deposit</div>
              {isValidUpiId(upi) && <UpiRequestCard request={previewRequest} />}
            </div>
          </Panel>

          <Panel title="Daily report">
            <div id="daily-report" className="divide-y divide-line">
              <Toggle checked={report} onChange={setReport} label="Send me a daily summary on WhatsApp" description="Conversations, bookings, missed calls recovered, top questions and estimated revenue." />
              {report && (
                <div className="flex items-center justify-between gap-4 py-3">
                  <span className="text-sm">Send at</span>
                  <Input type="time" aria-label="Daily report time" value={reportTime} onChange={(e) => setReportTime(e.target.value)} className="!w-32" />
                </div>
              )}
            </div>
          </Panel>

          <Panel title="Usage limits">
            <div id="usage-limits" className="grid items-end gap-4 md:grid-cols-2">
              <Field label="Max conversations per month" hint="After this, Reppy tells customers you'll reply personally, and alerts you.">
                <Select value={cap} onChange={(e) => setCap(e.target.value)}>
                  {["100", "500", "2000", "5000"].map((c) => (
                    <option key={c} value={c}>
                      {Number(c).toLocaleString("en-IN")} conversations
                    </option>
                  ))}
                </Select>
              </Field>
              <Toggle checked={alertAt} onChange={setAlertAt} label="Warn me at 80%" />
            </div>
          </Panel>

          <Panel title="Data & privacy">
            <div id="data-privacy" className="space-y-4 text-[13.5px] text-fg-2">
              <p className="flex gap-2.5">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-teal-400" />
                Reppy follows India&apos;s DPDP Act: it collects only what&apos;s needed to book and follow up, honours STOP replies, and lets you or your customers delete data at any time.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" size="sm" onClick={() => toast(live ? "Data export arrives in a later update." : "Export started. We'll WhatsApp you a download link.")}>
                  Export all data
                </Button>
                <Button variant="ghost" size="sm" className="text-bad" onClick={() => toast(live ? "Deleting a business from here arrives in a later update." : "To delete your business, confirm by replying DELETE on WhatsApp")}>
                  Delete business and all data
                </Button>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}
