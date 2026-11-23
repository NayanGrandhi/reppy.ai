import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { ButtonLink } from "@/components/ui/button";
import { listBrains } from "@/lib/server/store";

export const dynamic = "force-dynamic";
export const metadata = { title: "Chat demo — Reppy AI" };

export default async function ChatIndex() {
  const brains = await listBrains();
  const demos = brains.filter((b) => b.isDemo);
  const mine = brains.filter((b) => !b.isDemo);
  return (
    <>
      <AppHeader active="chat" />
      <main className="mx-auto max-w-4xl px-5 py-12 md:px-8 md:py-16">
        <h1 className="display text-[44px] md:text-[56px]">Talk to Reppy as a customer</h1>
        <p className="mt-3 max-w-xl text-[16px] text-fg-2">Pick a business. Reppy answers only from its business brain, in English, Hindi or Hinglish.</p>

        <h2 className="mt-12 mb-4 text-[14px] text-fg-3">Sample businesses</h2>
        <ul className="grid gap-px overflow-hidden rounded-[24px] bg-line ring-1 ring-line sm:grid-cols-2">
          {demos.map((b) => (
            <li key={b.slug}>
              <Link href={`/chat/${b.slug}`} className="block h-full bg-ink-900 p-6 transition-colors hover:bg-ink-800">
                <div className="text-[12.5px] text-fg-3">{b.brain.type}</div>
                <div className="display mt-1 text-[30px]">{b.brain.name}</div>
                <div className="mt-3 text-[14px] text-violet-300">Start chatting</div>
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-12 mb-4 flex items-center justify-between">
          <h2 className="text-[14px] text-fg-3">Businesses set up by you</h2>
          <ButtonLink href="/setup" size="sm" variant="secondary">
            Set up a business
          </ButtonLink>
        </div>
        {mine.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line-strong p-6 text-[14px] text-fg-3">
            None yet. Set one up from a rate card photo or a few lines of notes; it takes about a minute.
          </p>
        ) : (
          <ul className="divide-y divide-line rounded-2xl ring-1 ring-line">
            {mine.map((b) => (
              <li key={b.slug}>
                <Link href={`/chat/${b.slug}`} className="flex items-center justify-between px-5 py-4 hover:bg-white/[0.02]">
                  <span>
                    <span className="block text-[15px] font-medium">{b.brain.name}</span>
                    <span className="text-[12.5px] text-fg-3">{b.brain.type}</span>
                  </span>
                  <span className="text-[13px] text-violet-300">Chat</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
