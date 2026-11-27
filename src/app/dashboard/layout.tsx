import { DashboardShell } from "@/components/dashboard/shell";
import { NoBusinessYet } from "@/components/dashboard/no-business";
import { DashboardDataProvider } from "@/lib/dashboard/context";
import { sampleDashboard } from "@/lib/dashboard/sample";
import { loadLiveDashboard } from "@/lib/server/dashboard";
import { supabaseAsUser } from "@/lib/supabase/server";

export const metadata = { title: "Dashboard", robots: { index: false } };
export const dynamic = "force-dynamic";

/**
 * Signed out: the sample dashboard (made-up Glow Studio data).
 * Signed in: the owner's real business from the database.
 */
export default async function Layout({ children }: { children: React.ReactNode }) {
  const supa = await supabaseAsUser();
  const { data } = await supa.auth.getUser();
  const user = data.user;
  if (!user) {
    return (
      <DashboardDataProvider data={sampleDashboard()}>
        <DashboardShell>{children}</DashboardShell>
      </DashboardDataProvider>
    );
  }
  const live = await loadLiveDashboard(supa, user);
  if (!live) return <NoBusinessYet email={user.email ?? ""} />;
  return (
    <DashboardDataProvider data={live}>
      <DashboardShell email={user.email ?? ""}>{children}</DashboardShell>
    </DashboardDataProvider>
  );
}
