"use client";
import { ArrowDownUp, Download, Search } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { deleteCustomer, saveCustomerNote } from "@/app/dashboard/actions";
import { ChannelIcon, StatusBadge, apptMeta } from "@/components/dashboard/bits";
import { PageHeader } from "@/components/dashboard/shell";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Segmented, Textarea } from "@/components/ui/controls";
import { Drawer } from "@/components/ui/overlay";
import { useToast } from "@/components/ui/toast";
import { useData } from "@/lib/dashboard/context";
import type { Customer } from "@/lib/types";
import { cn, formatDate, formatINR, formatTime, relativeDay } from "@/lib/utils";

type SortKey = "name" | "visits" | "spendINR" | "firstSeen";

function CustomersInner() {
  const { getCustomers, live } = useData();
  const params = useSearchParams();
  const toast = useToast();
  const serverList = getCustomers();
  const [list, setList] = useState<Customer[]>(serverList);
  useEffect(() => setList(serverList), [serverList]);
  const [q, setQ] = useState("");
  const [seg, setSeg] = useState<"all" | "Regular" | "New">("all");
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "spendINR", dir: -1 });
  const [openId, setOpenId] = useState<string | null>(params.get("open"));

  const rows = useMemo(() => {
    const f = list.filter(
      (c) => (seg === "all" || c.tags.includes(seg)) && (!q || `${c.name} ${c.phone}`.toLowerCase().includes(q.toLowerCase())),
    );
    return [...f].sort((a, b) => (a[sort.key] > b[sort.key] ? 1 : a[sort.key] < b[sort.key] ? -1 : 0) * sort.dir);
  }, [list, q, seg, sort]);

  const open = list.find((c) => c.id === openId) ?? null;
  const th = (key: SortKey, label: string, cls = "") => (
    <th className={cn("px-4 py-3 font-normal", cls)}>
      <button
        onClick={() => setSort((s) => ({ key, dir: s.key === key ? ((-s.dir) as 1 | -1) : -1 }))}
        className={cn("inline-flex items-center gap-1 hover:text-fg", sort.key === key && "text-fg")}
      >
        {label}
        <ArrowDownUp className="size-3" />
      </button>
    </th>
  );

  return (
    <>
      <PageHeader
        title="Customers"
        description="Everyone who has messaged or called. Reppy only keeps what it needs to book and follow up."
        actions={
          <Button variant="secondary" onClick={() => toast(live ? "Export arrives in a later update" : "customers.csv exported")}>
            <Download className="size-4" /> Export CSV
          </Button>
        }
      />
      <div className="panel overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4">
          <label className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-fg-3" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name or phone"
              className="h-9 w-72 max-w-full rounded-full bg-white/[0.04] pr-3 pl-9 text-[13px] ring-1 ring-line outline-none placeholder:text-fg-3 focus:ring-violet-500/50"
            />
          </label>
          <Segmented
            size="sm"
            value={seg}
            onChange={setSeg}
            options={[
              { value: "all", label: `All ${list.length}` },
              { value: "Regular", label: "Regulars" },
              { value: "New", label: "New" },
            ]}
          />
        </div>
        <div className="scroll-thin overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-[14px]">
            <thead className="text-[12.5px] text-fg-3">
              <tr className="border-b border-line">
                {th("name", "Customer")}
                <th className="px-4 py-3 font-normal">Language</th>
                {th("visits", "Visits", "text-right")}
                {th("spendINR", "Spend", "text-right")}
                {th("firstSeen", "First seen")}
                <th className="px-4 py-3 font-normal">Tags</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} onClick={() => setOpenId(c.id)} className="cursor-pointer border-b border-line/70 transition-colors last:border-0 hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={c.name} size={32} />
                      <div>
                        <button className="font-medium hover:underline" onClick={() => setOpenId(c.id)}>
                          {c.name}
                        </button>
                        <div className="text-[12.5px] text-fg-3 tabular-nums">{c.phone}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-fg-2">{c.language}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{c.visits}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatINR(c.spendINR)}</td>
                  <td className="px-4 py-3 text-fg-2">{formatDate(c.firstSeen, { day: "numeric", month: "short", year: "numeric" })}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {c.tags.map((t) => (
                        <Badge key={t} tone={t === "New" ? "violet" : t === "Missed call" ? "warn" : "neutral"}>
                          {t}
                        </Badge>
                      ))}
                      {!c.optedIn && <Badge tone="bad">Opted out</Badge>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && <p className="p-10 text-center text-sm text-fg-3">No customers match. Clear the search to see everyone.</p>}
        </div>
      </div>

      <Drawer open={!!open} onClose={() => setOpenId(null)} title="Customer">
        {open && (
          <CustomerDetail
            c={open}
            onSaveNote={async (notes) => {
              if (live) {
                const r = await saveCustomerNote(open.id, notes);
                if (!r.ok) return toast(r.error);
              }
              setList((l) => l.map((x) => (x.id === open.id ? { ...x, notes } : x)));
              toast("Note saved. Reppy will use it in future chats.");
            }}
            onDelete={async () => {
              if (live) {
                const r = await deleteCustomer(open.id);
                if (!r.ok) return toast(r.error);
              }
              setList((l) => l.filter((x) => x.id !== open.id));
              setOpenId(null);
              toast(`${open.name}'s data deleted`);
            }}
          />
        )}
      </Drawer>
    </>
  );
}

export default function CustomersPage() {
  return (
    <Suspense>
      <CustomersInner />
    </Suspense>
  );
}

function CustomerDetail({ c, onSaveNote, onDelete }: { c: Customer; onSaveNote: (n: string) => void; onDelete: () => void }) {
  const { DEMO_TODAY, getAppointments, getConversations, serviceById } = useData();
  const [note, setNote] = useState(c.notes);
  const [confirm, setConfirm] = useState(false);
  const convos = getConversations().filter((x) => x.customerId === c.id);
  const appts = getAppointments().filter((a) => a.customerId === c.id).sort((a, b) => b.start.localeCompare(a.start));
  return (
    <div className="space-y-7">
      <div className="flex items-center gap-4">
        <Avatar name={c.name} size={52} />
        <div>
          <div className="text-xl font-semibold">{c.name}</div>
          <div className="text-[13px] text-fg-3">
            {c.phone} · prefers {c.language}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 divide-x divide-line rounded-2xl text-center ring-1 ring-line">
        {[
          ["Visits", c.visits],
          ["Spend", formatINR(c.spendINR)],
          ["Since", formatDate(c.firstSeen, { month: "short", year: "numeric" })],
        ].map(([k, v]) => (
          <div key={String(k)} className="py-3">
            <div className="text-[17px] font-semibold tabular-nums">{v}</div>
            <div className="text-[12px] text-fg-3">{k}</div>
          </div>
        ))}
      </div>

      <section>
        <h3 className="mb-2 text-[13px] font-medium text-fg-2">Notes for Reppy</h3>
        <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Prefers Anita, allergic to ammonia" />
        {note !== c.notes && (
          <Button size="sm" className="mt-2" onClick={() => onSaveNote(note)}>
            Save note
          </Button>
        )}
      </section>

      <section>
        <h3 className="mb-2 text-[13px] font-medium text-fg-2">Appointments</h3>
        {appts.length === 0 ? (
          <p className="text-[13px] text-fg-3">No appointments yet.</p>
        ) : (
          <ul className="divide-y divide-line rounded-2xl ring-1 ring-line">
            {appts.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 px-4 py-3 text-[13.5px]">
                <div>
                  <div>{serviceById(a.serviceId)?.name}</div>
                  <div className="text-[12.5px] text-fg-3">
                    {relativeDay(a.start, DEMO_TODAY)}, {formatTime(a.start)}
                  </div>
                </div>
                <Badge tone={apptMeta[a.status].tone}>{apptMeta[a.status].label}</Badge>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3 className="mb-2 text-[13px] font-medium text-fg-2">Conversations</h3>
        {convos.length === 0 ? (
          <p className="text-[13px] text-fg-3">No conversations yet.</p>
        ) : (
          <ul className="space-y-2">
            {convos.map((x) => (
              <li key={x.id} className="flex gap-3 rounded-xl p-3 ring-1 ring-line">
                <ChannelIcon channel={x.channel} />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-[12.5px] text-fg-3">
                    {relativeDay(x.startedAt, DEMO_TODAY)} {formatTime(x.startedAt)} <StatusBadge status={x.status} />
                  </div>
                  <p className="mt-1 text-[13px] text-fg-2">{x.summary}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="border-t border-line pt-5">
        <h3 className="text-[13px] font-medium text-fg-2">Privacy</h3>
        <p className="mt-1 text-[13px] text-fg-3">Under India&apos;s DPDP Act, customers can ask you to delete their data. This removes their chats, bookings and notes.</p>
        {confirm ? (
          <div className="mt-3 flex gap-2">
            <Button size="sm" className="!bg-bad hover:!bg-bad/90" onClick={onDelete}>
              Delete permanently
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setConfirm(false)}>
              Keep
            </Button>
          </div>
        ) : (
          <Button size="sm" variant="ghost" className="mt-2 !px-0 text-bad hover:!bg-transparent" onClick={() => setConfirm(true)}>
            Delete this customer&apos;s data
          </Button>
        )}
      </section>
    </div>
  );
}
