import { DashboardShell } from "@/components/dashboard/shell";

export const metadata = { title: "Dashboard", robots: { index: false } };

export default function Layout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
