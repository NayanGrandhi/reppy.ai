import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { ButtonLink } from "@/components/ui/button";
import { MyBusinesses } from "@/components/chat/my-businesses";
import { listDemoBrains } from "@/lib/server/store";

export const dynamic = "force-dynamic";
export const metadata = { title: "Chat demo", description: "Talk to Reppy as a customer of a sample salon or clinic, in English, Hindi or Hinglish." };

export default async function ChatIndex() {
  const demos = await listDemoBrains();
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
          <h2 className="text-[14px] text-fg-3">Businesses you set up on this device</h2>
          <ButtonLink href="/setup" size="sm" variant="secondary">
            Set up a business
          </ButtonLink>
        </div>
        <MyBusinesses />
      </main>
    </>
  );
}
