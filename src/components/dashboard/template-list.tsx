"use client";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Segmented } from "@/components/ui/controls";
import { type TemplateLanguage, renderTemplate, templates } from "@/lib/whatsapp/templates";

/** Previews of the WhatsApp templates Reppy will submit to Meta. */
export function TemplateList() {
  const [lang, setLang] = useState<TemplateLanguage>("en");
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13px] text-fg-3">
          {templates.length} message templates, written and checked against Meta&apos;s rules. They go to Meta for approval when your number is connected.
        </p>
        <Segmented
          size="sm"
          value={lang}
          onChange={setLang}
          options={[
            { value: "en", label: "English" },
            { value: "hi", label: "हिन्दी" },
          ]}
        />
      </div>
      <ul className="divide-y divide-line rounded-2xl ring-1 ring-line">
        {templates.map((t) => (
          <li key={t.name}>
            <details className="group">
              <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-medium">{t.name.replace(/_/g, " ")}</span>
                  <span className="block truncate text-[12.5px] text-fg-3">{t.trigger}</span>
                </span>
                <Badge tone={t.audience === "owner" ? "saffron" : "neutral"}>{t.audience === "owner" ? "To you" : "To customers"}</Badge>
                <ChevronDown className="size-4 shrink-0 text-fg-3 transition-transform group-open:rotate-180" />
              </summary>
              <div className="px-4 pb-4">
                <div className="w-fit max-w-md rounded-2xl rounded-tl-md bg-[#1c2522] px-3.5 py-2.5 text-[14px] leading-relaxed">
                  {renderTemplate(t, lang, t.example)}
                  {t.footer && <div className="mt-1.5 text-[11.5px] text-fg-3">{t.footer[lang]}</div>}
                </div>
                {t.buttons && (
                  <div className="mt-1.5 flex max-w-md gap-1.5">
                    {t.buttons[lang].map((b) => (
                      <span key={b} className="flex-1 rounded-xl bg-[#1c2522] py-2 text-center text-[13px] text-teal-400">
                        {b}
                      </span>
                    ))}
                  </div>
                )}
                <p className="mt-2 text-[12px] text-fg-3">Filled with example values. Utility category: ₹0.115 + GST per message.</p>
              </div>
            </details>
          </li>
        ))}
      </ul>
    </div>
  );
}
