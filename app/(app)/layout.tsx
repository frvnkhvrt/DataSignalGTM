import { redirect } from "next/navigation";
import { RealtimeSync } from "@/components/auth/realtime-sync";
import { CommandPalette } from "@/components/command-palette";
import { OnboardingGuard } from "@/components/onboarding-guard";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { RulesEngineSync } from "@/components/rules-engine-sync";
import { AuthProvider } from "@/lib/auth-context";
import { getAuthContext } from "@/lib/supabase/server";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await getAuthContext();

  if (!auth) {
    redirect("/login");
  }

  return (
    <AuthProvider
      value={{
        org: auth.org,
        user: {
          id: auth.user.id,
          email: auth.user.email ?? null,
        },
      }}
    >
      <RealtimeSync orgId={auth.org.id} />
      <RulesEngineSync orgId={auth.org.id} />
      <CommandPalette />
      <OnboardingGuard>
        <div className="min-h-screen bg-zinc-950 text-zinc-100">
          <Sidebar />
          <div className="pb-16 sm:pb-0 sm:pl-60">
            <TopBar />
            <main>{children}</main>
          </div>
        </div>
      </OnboardingGuard>
    </AuthProvider>
  );
}
