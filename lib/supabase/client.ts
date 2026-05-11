import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";

const _url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const _anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const supabaseConfigured = !!(_url && _anonKey);

export const supabaseMissingVars = [
  ...(!_url ? ["NEXT_PUBLIC_SUPABASE_URL"] : []),
  ...(!_anonKey ? ["NEXT_PUBLIC_SUPABASE_ANON_KEY"] : []),
];

let _supabase: ReturnType<typeof createBrowserClient<Database>> | undefined;

export const supabase = new Proxy(
  {} as ReturnType<typeof createBrowserClient<Database>>,
  {
    get(_, prop, receiver) {
      if (!_supabase) {
        if (!supabaseConfigured) {
          throw new Error(
            `Missing Supabase env var(s): ${supabaseMissingVars.join(", ")}. Add them to .env.local.`
          );
        }
        _supabase = createBrowserClient<Database>(_url, _anonKey);
      }
      return Reflect.get(_supabase, prop, receiver);
    },
  }
);
