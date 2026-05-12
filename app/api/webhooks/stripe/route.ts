import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

// Stripe sends raw bodies — disable Next.js body parsing.
export const runtime = "nodejs";

function tierFromPriceId(priceId: string | null | undefined): "free" | "pro" | "enterprise" {
  if (!priceId) return "free";
  if (priceId === process.env.STRIPE_PRO_PRICE_ID) return "pro";
  return "pro"; // default any unknown paid price to pro
}

// Stripe v22 uses the "basil" API which restructured billing cycle dates.
// We access them via a type-safe escape hatch since the exact field path
// depends on the API version in use.
function getPeriodEnd(sub: Record<string, unknown>): string | null {
  const raw = sub["current_period_end"] as number | undefined;
  return raw != null ? new Date(raw * 1000).toISOString() : null;
}

async function upsertSubscription(
  sub: Stripe.Subscription,
  db: ReturnType<typeof createAdminClient>
) {
  const raw = sub as unknown as Record<string, unknown>;
  const orgId = sub.metadata?.org_id ?? null;
  if (!orgId) {
    logger.warn("stripe-webhook-no-org-id", { subscriptionId: sub.id });
    return;
  }

  const priceId = (sub.items?.data?.[0]?.price?.id) ?? null;
  const cancelAtPeriodEnd = (raw["cancel_at_period_end"] as boolean | undefined) ?? false;

  await db.from("subscriptions").upsert({
    id: sub.id,
    org_id: orgId,
    customer_id: sub.customer as string,
    status: sub.status,
    price_id: priceId,
    current_period_end: getPeriodEnd(raw),
    cancel_at_period_end: cancelAtPeriodEnd,
    updated_at: new Date().toISOString(),
  });

  const tier = tierFromPriceId(priceId);
  const isActive = ["active", "trialing"].includes(sub.status as string);

  await db
    .from("organizations")
    .update({
      subscription_tier: isActive ? tier : "free",
      stripe_customer_id: sub.customer as string,
    })
    .eq("id", orgId);

  logger.info("stripe-subscription-upserted", {
    orgId,
    subscriptionId: sub.id,
    status: sub.status,
    tier,
  });
}

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook not configured." }, { status: 500 });
  }

  const sig = request.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature." }, { status: 400 });
  }

  let event: Stripe.Event;
  const body = await request.text();

  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    logger.error("stripe-webhook-signature-error", err);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  const db = createAdminClient();

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        await upsertSubscription(event.data.object as Stripe.Subscription, db);
        break;
      }
      case "checkout.session.completed": {
        const session = event.data.object as unknown as {
          subscription?: string;
          metadata?: Record<string, string> | null;
        };
        if (session.subscription && typeof session.subscription === "string") {
          const stripe = getStripe();
          const sub = await stripe.subscriptions.retrieve(session.subscription);
          // Attach org_id metadata to subscription if missing.
          const subRaw = sub as unknown as { metadata?: Record<string, string> };
          if (!subRaw.metadata?.org_id && session.metadata?.org_id) {
            await stripe.subscriptions.update(session.subscription, {
              metadata: { org_id: session.metadata.org_id },
            });
          }
          await upsertSubscription(sub, db);
        }
        break;
      }
      default:
        // Unhandled events are acknowledged without error.
        break;
    }
  } catch (err) {
    logger.error("stripe-webhook-handler-error", err, { eventType: event.type });
    return NextResponse.json({ error: "Webhook handler failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
