import Link from "next/link";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "light";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-medium whitespace-nowrap transition-[background,color,box-shadow,transform] duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  primary:
    "bg-violet-600 text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.2),0_8px_24px_-8px_rgb(139_123_255/0.7)] hover:bg-violet-700",
  secondary: "bg-white/[0.06] text-fg border border-line-strong hover:bg-white/[0.1]",
  ghost: "text-fg-2 hover:text-fg hover:bg-white/[0.05]",
  light: "bg-fg text-ink-950 hover:bg-white shadow-[0_8px_30px_-10px_rgb(255_255_255/0.5)]",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3.5 text-[13px]",
  md: "h-10 px-5 text-sm",
  lg: "h-12 px-7 text-[15px]",
};

type Common = { variant?: Variant; size?: Size; className?: string; children: React.ReactNode };

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: Common & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={cn(base, variants[variant], sizes[size], className)} {...props} />;
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  href,
  children,
}: Common & { href: string }) {
  return (
    <Link href={href} className={cn(base, variants[variant], sizes[size], className)}>
      {children}
    </Link>
  );
}
