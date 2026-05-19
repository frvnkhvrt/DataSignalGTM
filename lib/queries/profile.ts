import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";

export const profileOnboardingQuery = (userId: string) =>
  queryOptions({
    queryKey: ["profile", userId, "onboarding"],
    queryFn: async (): Promise<boolean> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("id", userId)
        .maybeSingle();
      if (error) throw error;
      return data?.onboarding_completed === true;
    },
  });
