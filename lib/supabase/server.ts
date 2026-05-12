import { createServerClient } from "@supabase/ssr";
import { createClient, type User } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { getPublicEnv, getRequiredServerEnv } from "@/lib/env";
import type { Database } from "./types";

export type CurrentOrg = {
  id: string;
  name: string;
  slug: string;
  role: "admin" | "member";
};

export type AuthContext = {
  user: User;
  org: CurrentOrg;
};

/**
 * RLS-aware server client for Server Components, Route Handlers, and
 * Server Actions. Uses the anon key so all queries respect Row Level Security.
 */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();
  const env = getPublicEnv();

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll can fail in Server Components (read-only context).
            // Safe to ignore — cookies are only writable in Route Handlers
            // and Server Actions.
          }
        },
      },
    }
  );
}

/**
 * Admin client for privileged server-side operations that bypass RLS
 * (e.g. playbook writes, signal inserts from webhooks).
 * Uses the service role key — never expose this client to the browser.
 */
export function createAdminClient() {
  const env = getPublicEnv();
  const serviceRoleKey = getRequiredServerEnv("SUPABASE_SERVICE_ROLE_KEY");

  return createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function profileName(user: User): string {
  const metadataName =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : typeof user.user_metadata?.name === "string"
        ? user.user_metadata.name
        : null;

  return metadataName ?? user.email?.split("@")[0] ?? "DataSignal User";
}

async function createPersonalOrg(user: User): Promise<CurrentOrg> {
  const admin = createAdminClient();
  const name = profileName(user);
  const baseSlug = slugify(
    user.email?.split("@")[1] ?? user.email?.split("@")[0] ?? user.id
  );
  const slug = `${baseSlug || "workspace"}-${user.id.slice(0, 8)}`;

  const { data: org, error: orgError } = await admin
    .from("organizations")
    .insert({
      name: `${name}'s Workspace`,
      slug,
    })
    .select("id,name,slug")
    .single();

  if (orgError) throw orgError;

  const { error: profileError } = await admin.from("profiles").upsert({
    id: user.id,
    org_id: org.id,
    role: "admin",
    full_name: name,
    avatar_url:
      typeof user.user_metadata?.avatar_url === "string"
        ? user.user_metadata.avatar_url
        : null,
  });

  if (profileError) throw profileError;

  const { error: memberError } = await admin
    .from("organization_members")
    .upsert({
      org_id: org.id,
      user_id: user.id,
      role: "admin",
    });

  if (memberError) throw memberError;

  return {
    id: org.id,
    name: org.name,
    slug: org.slug,
    role: "admin",
  };
}

export async function getCurrentOrg(user: User): Promise<CurrentOrg | null> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("organization_members")
    .select("org_id,role,organizations(id,name,slug)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const org = Array.isArray(data.organizations)
    ? data.organizations[0]
    : data.organizations;

  if (!org) return null;

  return {
    id: org.id,
    name: org.name,
    slug: org.slug,
    role: data.role,
  };
}

export async function getAuthContext(): Promise<AuthContext | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const org = (await getCurrentOrg(user)) ?? (await createPersonalOrg(user));

  return { user, org };
}
