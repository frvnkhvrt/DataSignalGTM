"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthContext } from "@/lib/auth-context";
import { profileOnboardingQuery } from "@/lib/queries/profile";
import { OnboardingModal } from "@/components/onboarding/onboarding-modal";

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();
  const { data: onboardingComplete, isLoading } = useQuery(
    profileOnboardingQuery(user.id)
  );

  if (isLoading) return null;

  const showOnboarding = onboardingComplete !== true;

  return (
    <>
      {showOnboarding && (
        <OnboardingModal
          onComplete={() => {
            void queryClient.invalidateQueries({
              queryKey: ["profile", user.id, "onboarding"],
            });
          }}
        />
      )}
      {children}
    </>
  );
}
