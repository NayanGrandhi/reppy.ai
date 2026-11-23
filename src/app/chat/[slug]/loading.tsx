import { AppHeader } from "@/components/app-header";

// Skeleton while a business brain loads from the database.
export default function Loading() {
  return (
    <>
      <AppHeader active="chat" />
      <main className="mx-auto max-w-6xl px-5 py-8 md:px-8" aria-busy>
        <div className="mb-6 h-4 w-28 animate-pulse rounded bg-white/[0.06]" />
        <div className="mb-8 h-10 w-72 animate-pulse rounded-lg bg-white/[0.06]" />
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="h-[min(720px,calc(100dvh-140px))] animate-pulse rounded-[28px] bg-[#0f1a17]" />
          <div className="hidden space-y-4 lg:block">
            <div className="h-36 animate-pulse rounded-2xl bg-white/[0.04]" />
            <div className="h-44 animate-pulse rounded-2xl bg-white/[0.04]" />
          </div>
        </div>
      </main>
    </>
  );
}
