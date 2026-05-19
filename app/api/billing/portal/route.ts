import { NextResponse } from "next/server";
import { billingPortalResponseSchema } from "@/lib/api-contracts";
import { getStripe, getAppUrl } from "@/lib/stripe";
import { createAdminClient, getAuthContext } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

export async function POST() {
  const auth = await getAuthContext();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (auth.isDemo) {
    return NextResponse.json(
      { error: "Billing portal is disabled in demo mode." },
      { status: 403 }
    );
  }

  try {
    const stripe = getStripe();
    const db = createAdminClient();
    const appUrl = getAppUrl();

    const { data: org } = await db
      .from("organizations")
      .select("stripe_customer_id")
      .eq("id", auth.org.id)
      .single();

    if (!org?.stripe_customer_id) {
      return NextResponse.json(
        { error: "No Stripe customer found for this organisation." },
        { status: 404 }
      );
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: org.stripe_customer_id,
      return_url: `${appUrl}/settings/billing`,
    });

    const response = { url: session.url ?? "" };
    const validated = billingPortalResponseSchema.safeParse(response);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Portal session missing redirect URL." },
        { status: 500 }
      );
    }
    return NextResponse.json(validated.data);
  } catch (err) {
    logger.error("stripe-portal-error", err);
    return NextResponse.json(
      { error: "Failed to create portal session." },
      { status: 500 }
    );
  }
}
