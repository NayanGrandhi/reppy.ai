import Link from "next/link";
import { Logo } from "@/components/ui/logo";

/** Slim header for the working pages (setup, chat). */
export function AppHeader({ active }: { active?: "setup" | "chat" }) {
  const link = (href: string, label: string, short: string, on: boolean) => (
    <Link href={href} className={on ? "text-fg" : "text-fg-3 hover:text-fg-2"} aria-current={on ? "page" : undefined}>
      <span className="hidden sm:inline">{label}</span>
      <span className="sm:hidden">{short}</span>
    </Link>
  );
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ink-950/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-5 md:px-8">
        <Logo />
        <nav className="ml-auto flex items-center gap-4 text-[14px] sm:gap-5">
          {link("/setup", "Set up a business", "Set up", active === "setup")}
          {link("/chat", "Chat demo", "Chat", active === "chat")}
          {link("/dashboard", "Dashboard", "Dashboard", false)}
        </nav>
      </div>
    </header>
  );
}
