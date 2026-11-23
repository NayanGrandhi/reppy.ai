import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { ChatWindow } from "@/components/chat/chat-window";
import { getBrain } from "@/lib/server/store";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ new?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const stored = await getBrain(slug);
  return { title: stored ? `Chat with ${stored.brain.name} — Reppy AI` : "Chat — Reppy AI" };
}

export default async function ChatPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { new: isNew } = await searchParams;
  const stored = await getBrain(slug);
  if (!stored) notFound();

  return (
    <>
      <AppHeader active="chat" />
      <main className="mx-auto max-w-6xl px-3 py-4 sm:px-5 md:px-8 md:py-8">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3 px-1 md:mb-6">
          <div>
            <Link href="/chat" className="text-[13px] text-fg-3 hover:text-fg">
              All businesses
            </Link>
            <h1 className="display mt-1 hidden text-[40px] sm:block md:text-[48px]">Chat as a customer</h1>
          </div>
          <span className="rounded-full border border-dashed border-line-strong px-3 py-1 text-[12.5px] text-fg-3">
            {stored.isDemo ? "Sample business" : "Your business"}
          </span>
        </div>
        <ChatWindow slug={stored.slug} brain={stored.brain} isNew={isNew === "1"} />
      </main>
    </>
  );
}
