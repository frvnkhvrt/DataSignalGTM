import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";

function makeBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    const missing = [
      ...(!url ? ["NEXT_PUBLIC_SUPABASE_URL"] : []),
      ...(!anonKey ? ["NEXT_PUBLIC_SUPABASE_ANON_KEY"] : []),
    ];
    throw new Error(
      `Missing Supabase env var(s): ${missing.join(", ")}. Add them to .env.local.`
    );
  }

  return createBrowserClient<Database>(url, anonKey);
}

let _supabase: ReturnType<typeof makeBrowserClient> | undefined;

export const supabase = new Proxy({} as ReturnType<typeof makeBrowserClient>, {
  get(_, prop, receiver) {
    if (!_supabase) _supabase = makeBrowserClient();
    return Reflect.get(_supabase, prop, receiver);
  },
});
