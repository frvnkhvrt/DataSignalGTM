import { NextRequest, NextResponse } from "next/server";
import { getStripe, getAppUrl } from "@/lib/stripe";
import { createAdminClient, getAuthContext } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { trackServer } from "@/lib/analytics.server";

export async function POST(request: NextRequest) {
  const auth = await getAuthContext();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let priceId: string;
  try {
    const body = (await request.json()) as { priceId?: string };
    priceId =
      body.priceId ?? process.env.STRIPE_PRO_PRICE_ID ?? "";
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  if (!priceId) {
    return NextResponse.json(
      { error: "STRIPE_PRO_PRICE_ID is not configured." },
      { status: 500 }
    );
  }

  try {
    const stripe = getStripe();
    const db = createAdminClient();
    const appUrl = getAppUrl();

    // Fetch or create a Stripe customer for this org.
    const { data: org } = await db
      .from("organizations")
      .select("id,name,stripe_customer_id")
      .eq("id", auth.org.id)
      .single();

    let customerId = org?.stripe_customer_id ?? null;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: auth.user.email,
        name: org?.name,
        metadata: { org_id: auth.org.id },
      });
      customerId = customer.id;

      await db
        .from("organizations")
        .update({ stripe_customer_id: customerId })
        .eq("id", auth.org.id);
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/dashboard?upgraded=1`,
      cancel_url: `${appUrl}/settings/billing`,
      metadata: { org_id: auth.org.id },
      subscription_data: { metadata: { org_id: auth.org.id } },
      allow_promotion_codes: true,
    });

    await trackServer(
      { event: "signal_approved", properties: { org_id: auth.org.id, account_name: "billing_checkout_started" } },
      auth.user.id
    );

    return NextResponse.json({ url: session.url });
  } catch (err) {
    logger.error("stripe-checkout-error", err);
    return NextResponse.json(
      { error: "Failed to create checkout session." },
      { status: 500 }
    );
  }
}
