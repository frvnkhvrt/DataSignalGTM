import { createBrowserClient } from "@supabase/ssr";
import { getPublicEnv, getPublicEnvStatus } from "@/lib/env";
import type { Database } from "./types";

const publicEnvStatus = getPublicEnvStatus();

export const supabaseConfigured = publicEnvStatus.configured;
export const supabaseMissingVars = publicEnvStatus.invalidVars;

let _supabase: ReturnType<typeof createBrowserClient<Database>> | undefined;

export const supabase = new Proxy(
  {} as ReturnType<typeof createBrowserClient<Database>>,
  {
    get(_, prop, receiver) {
      if (!_supabase) {
        if (!supabaseConfigured) {
          throw new Error(
            `${publicEnvStatus.message}. Add valid Supabase values to .env.local.`
          );
        }
        const env = getPublicEnv();
        _supabase = createBrowserClient<Database>(
          env.NEXT_PUBLIC_SUPABASE_URL,
          env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );
      }
      return Reflect.get(_supabase, prop, receiver);
    },
  }
);
