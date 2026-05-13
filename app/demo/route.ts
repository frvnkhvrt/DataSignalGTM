import { NextRequest, NextResponse } from "next/server";
import { trackServer } from "@/lib/analytics.server";
import {
  DEMO_EMAIL,
  DEMO_ORG_ID,
  DEMO_ORG_NAME,
  DEMO_ORG_SLUG,
} from "@/lib/demo";
import { getOptionalServerEnv } from "@/lib/env";
import {
  createAdminClient,
  createServerSupabaseClient,
} from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const DEMO_PASSWORD = getOptionalServerEnv("DEMO_USER_PASSWORD") ?? "demo2026!";
const DEMO_PROFILE_NAME = "Demo User";

type AdminClient = ReturnType<typeof createAdminClient>;
type DemoAuthUser = {
  id: string;
  email?: string;
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
};

function withDemoFlag(metadata: Record<string, unknown> | undefined) {
  return {
    ...(metadata ?? {}),
    is_demo: true,
  };
}

async function signInDemoUser() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.signInWithPassword({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
  });

  return { user, error };
}

async function findAuthUserByEmail(
  admin: AdminClient,
  email: string
): Promise<DemoAuthUser | null> {
  const target = email.toLowerCase();

  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 100,
    });

    if (error) throw error;

    const users = data.users ?? [];
    const user = users.find(
      (candidate) => candidate.email?.toLowerCase() === target
    );

    if (user) return user;
    if (users.length < 100) return null;
  }

  return null;
}

async function ensureDemoOrg(admin: AdminClient) {
  const { data: existingOrg, error: lookupError } = await admin
    .from("organizations")
    .select("id,name,slug")
    .eq("slug", DEMO_ORG_SLUG)
    .maybeSingle();

  if (lookupError) throw lookupError;
  if (existingOrg) return existingOrg;

  const { data: createdOrg, error: createError } = await admin
    .from("organizations")
    .insert({
      id: DEMO_ORG_ID,
      name: DEMO_ORG_NAME,
      slug: DEMO_ORG_SLUG,
    })
    .select("id,name,slug")
    .single();

  if (createError) throw createError;
  return createdOrg;
}

async function ensureDemoMembership(admin: AdminClient, userId: string) {
  const org = await ensureDemoOrg(admin);
  const now = new Date().toISOString();

  const { error: profileError } = await admin.from("profiles").upsert({
    id: userId,
    org_id: org.id,
    role: "member",
    full_name: DEMO_PROFILE_NAME,
    avatar_url: null,
    onboarding_completed: true,
    onboarding_completed_at: now,
  });

  if (profileError) throw profileError;

  const { error: memberError } = await admin
    .from("organization_members")
    .upsert(
      {
        org_id: org.id,
        user_id: userId,
        role: "member",
      },
      { onConflict: "org_id,user_id" }
    );

  if (memberError) throw memberError;

  return org;
}

async function updateExistingDemoUser(
  admin: AdminClient,
  user: DemoAuthUser
) {
  const { data, error } = await admin.auth.admin.updateUserById(user.id, {
    password: DEMO_PASSWORD,
    email_confirm: true,
    app_metadata: withDemoFlag(user.app_metadata),
    user_metadata: {
      ...(user.user_metadata ?? {}),
      full_name: DEMO_PROFILE_NAME,
    },
  });

  if (error) throw error;
  await ensureDemoMembership(admin, user.id);
  return data.user ?? user;
}

async function ensureDemoUser(admin: AdminClient) {
  const existingUser = await findAuthUserByEmail(admin, DEMO_EMAIL);
  if (existingUser) {
    return { user: await updateExistingDemoUser(admin, existingUser), created: false };
  }

  const { data, error } = await admin.auth.admin.createUser({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    email_confirm: true,
    app_metadata: { is_demo: true },
    user_metadata: { full_name: DEMO_PROFILE_NAME },
  });

  if (error) {
    const racedUser = await findAuthUserByEmail(admin, DEMO_EMAIL);
    if (racedUser) {
      return { user: await updateExistingDemoUser(admin, racedUser), created: false };
    }
    throw error;
  }

  if (!data.user) {
    throw new Error("Supabase did not return a demo user after creation.");
  }

  await ensureDemoMembership(admin, data.user.id);
  return { user: data.user, created: true };
}

export async function GET(request: NextRequest) {
  let { user, error } = await signInDemoUser();
  let createdUser = false;

  if (error || !user) {
    try {
      const admin = createAdminClient();
      const ensured = await ensureDemoUser(admin);
      createdUser = ensured.created;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("[demo-login]", message);
      return NextResponse.json(
        {
          error:
            "Demo mode is not available. Confirm SUPABASE_SERVICE_ROLE_KEY is configured.",
        },
        { status: 503 }
      );
    }

    const retry = await signInDemoUser();
    user = retry.user;
    error = retry.error;
  }

  if (error || !user) {
    return NextResponse.json(
      { error: "Unable to sign in with the demo account." },
      { status: 401 }
    );
  }

  await trackServer(
    {
      event: "demo_started",
      properties: { org_id: DEMO_ORG_ID, created_user: createdUser },
    },
    user.id
  );

  return NextResponse.redirect(new URL("/dashboard", request.url));
}
