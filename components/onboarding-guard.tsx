"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuthContext } from "@/lib/auth-context";
import { OnboardingModal } from "@/components/onboarding-modal";

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { user } = useAuthContext();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function check() {
      const { data } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("id", user.id)
        .maybeSingle();

      if (mounted) {
        setShowOnboarding(data?.onboarding_completed === false);
        setChecked(true);
      }
    }
    void check();
    return () => {
      mounted = false;
    };
  }, [user.id]);

  return (
    <>
      {checked && showOnboarding && (
        <OnboardingModal onComplete={() => setShowOnboarding(false)} />
      )}
      {children}
    </>
  );
}
