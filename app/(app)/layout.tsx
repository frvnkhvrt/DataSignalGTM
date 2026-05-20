import { redirect } from "next/navigation";
import { RealtimeSync } from "@/components/auth/realtime-sync";
import { CommandPalette } from "@/components/app/command-palette";
import { ErrorBoundary } from "@/components/error-boundary";
import { OnboardingGuard } from "@/components/onboarding/onboarding-guard";
import { DemoBanner } from "@/components/layout/demo-banner";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { RulesEngineSync } from "@/components/rules-engine-sync";
import { AuthProvider } from "@/lib/auth-context";
import { getAuthContext } from "@/lib/supabase/server";

import { LayoutTransition } from "@/components/layout/layout-transition";

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
        isDemo: auth.isDemo,
      }}
    >
      <RealtimeSync orgId={auth.org.id} />
      <RulesEngineSync orgId={auth.org.id} />
      <CommandPalette />
      <OnboardingGuard>
        <div className="ds-page text-foreground">
          <Sidebar />
          <div className="pb-16 transition-[padding] duration-[var(--ds-duration-smooth)] ease-[var(--ease-premium)] sm:pb-0 sm:pl-[var(--sidebar-width)]">
            <TopBar />
            <DemoBanner />
            <main id="main-content" tabIndex={-1}>
              <ErrorBoundary>
                <LayoutTransition>{children}</LayoutTransition>
              </ErrorBoundary>
            </main>
          </div>
        </div>
      </OnboardingGuard>
    </AuthProvider>
  );
}
