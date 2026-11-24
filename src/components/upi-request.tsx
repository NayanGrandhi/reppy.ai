"use client";
import { Check, Copy } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { type UpiRequest, UpiError, buildUpiLink, upiQrSvg } from "@/lib/upi";
import { formatINR } from "@/lib/utils";

/** Shows a UPI payment request as a QR code plus the link to share. */
export function UpiRequestCard({ request }: { request: UpiRequest }) {
  const [svg, setSvg] = useState<string | null>(null);
  const [qrError, setQrError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { link, linkError } = useMemo(() => {
    try {
      return { link: buildUpiLink(request), linkError: null };
    } catch (e) {
      return { link: "", linkError: e instanceof UpiError ? e.message : "Couldn't build the payment link." };
    }
  }, [request]);
  const error = linkError ?? qrError;

  useEffect(() => {
    if (linkError) return;
    let alive = true;
    upiQrSvg(request)
      .then((s) => alive && setSvg(s))
      .catch(() => alive && setQrError("Couldn't draw the QR code."));
    return () => {
      alive = false;
    };
  }, [request, linkError]);

  if (error) return <p className="rounded-xl bg-bad/10 p-3 text-[13px] text-bad ring-1 ring-bad/25">{error}</p>;

  return (
    <div className="flex flex-wrap items-center gap-5 rounded-2xl bg-white/[0.03] p-4 ring-1 ring-line">
      <div className="size-36 shrink-0 overflow-hidden rounded-xl bg-white p-1.5" aria-label={`UPI QR code for ${formatINR(request.amountINR)} to ${request.upiId}`} role="img">
        {svg ? <div className="size-full [&>svg]:size-full" dangerouslySetInnerHTML={{ __html: svg }} /> : <div className="size-full animate-pulse rounded bg-ink-600/20" />}
      </div>
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="text-[22px] font-semibold tabular-nums">{formatINR(request.amountINR)}</div>
        <div className="text-[13px] text-fg-2">
          To <span className="text-fg">{request.payeeName}</span> · {request.upiId}
        </div>
        {request.note && <div className="text-[13px] text-fg-3">{request.note}</div>}
        <Button
          size="sm"
          variant="secondary"
          className="mt-1"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(link);
              setCopied(true);
              setTimeout(() => setCopied(false), 1800);
            } catch {
              setCopied(false);
            }
          }}
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          {copied ? "Copied" : "Copy payment link"}
        </Button>
        <p className="text-[11.5px] text-fg-3">Opens in GPay, PhonePe, Paytm or any UPI app. Money goes straight to this UPI ID.</p>
      </div>
    </div>
  );
}
