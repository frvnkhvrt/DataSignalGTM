import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/supabase/server";
import { prefetchDashboardQueries } from "@/lib/queries/prefetch";
import DashboardClient from "./dashboard-client";

export default async function DashboardPage() {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");

  const queryClient = new QueryClient();
  const { signals, accounts, keys } = await prefetchDashboardQueries(auth.org.id);

  queryClient.setQueryData(keys.signals.recent, signals);
  queryClient.setQueryData(keys.accounts.byDq, accounts);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DashboardClient />
    </HydrationBoundary>
  );
}
