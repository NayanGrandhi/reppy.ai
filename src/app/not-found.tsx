import { ButtonLink } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";

export default function NotFound() {
  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden px-6">
      <div className="pointer-events-none absolute top-1/3 left-1/2 size-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-600/20 blur-3xl" />
      <div className="relative text-center">
        <Logo className="mb-10 inline-flex" />
        <p className="text-[14px] text-fg-3">404</p>
        <h1 className="display mt-2 text-[44px] md:text-[56px]">Reppy couldn&apos;t find that page</h1>
        <p className="mx-auto mt-3 max-w-md text-[16px] text-fg-2">The link may be old, or a private business link may have been mistyped.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/" variant="light">
            Go to the home page
          </ButtonLink>
          <ButtonLink href="/chat" variant="secondary">
            Open the chat demo
          </ButtonLink>
        </div>
      </div>
    </main>
  );
}
