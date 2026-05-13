import Link from "next/link";
import { PLANS, PLAN_LIMITS } from "@/lib/stripe";

export const metadata = { title: "Pricing & Limits — DataSignalGTM Docs" };

export default function PricingDocsPage() {
  return (
    <article className="space-y-8 text-muted-foreground">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Pricing &amp; Limits</h1>
        <p className="mt-3 text-muted-foreground">
          DataSignalGTM offers three tiers. All plans include core features;
          higher tiers unlock capacity and advanced capabilities.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Plan comparison</h2>
        <div className="overflow-x-auto overscroll-x-contain rounded-lg border border-border/80 bg-background/30">
          <table className="w-full min-w-0 text-sm">
            <thead className="border-b border-border/80 bg-muted/50 text-left text-[11px] uppercase tracking-wide text-muted-foreground backdrop-blur-sm">
              <tr>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Signals / month</th>
                <th className="px-4 py-3">Playbooks / month</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {PLANS.map((plan) => {
                const limits = PLAN_LIMITS[plan.id];
                return (
                  <tr key={plan.id}>
                    <td className="px-4 py-3 font-semibold text-foreground">
                      {plan.name}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {plan.price}{" "}
                      <span className="text-muted-foreground/60">{plan.priceSub}</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {limits.signalsPerMonth === Infinity
                        ? "Unlimited"
                        : limits.signalsPerMonth.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {limits.playbooksPerMonth === Infinity
                        ? "Unlimited"
                        : limits.playbooksPerMonth.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">What happens when I hit my limit?</h2>
        <p className="text-sm">
          On the <strong className="text-foreground">Free</strong> plan:
        </p>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          <li>New signals via webhook return a <code className="rounded bg-muted px-1 py-0.5 text-xs text-foreground">429 Too Many Requests</code> with a clear error message.</li>
          <li>The dashboard shows a usage banner when you reach 80% of the monthly limit.</li>
          <li>Playbook generation is blocked once the monthly allowance is exhausted.</li>
        </ul>
        <p className="text-sm">
          Upgrade at any time from{" "}
          <Link href="/settings/billing" className="text-primary hover:underline">
            Settings → Billing
          </Link>
          . Upgrades take effect immediately.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Billing FAQ</h2>
        <div className="space-y-4">
          {[
            {
              q: "Can I cancel my subscription anytime?",
              a: "Yes. Cancel from the Stripe Customer Portal (Settings → Billing → Manage). Your plan stays active until the end of the billing period.",
            },
            {
              q: "Do unused signals roll over?",
              a: "No. Signal limits reset on the 1st of each calendar month.",
            },
            {
              q: "Is there a free trial for Pro?",
              a: "We offer a 14-day free trial on Pro for new accounts. No credit card required to start. Stripe will prompt for payment details before the trial ends.",
            },
            {
              q: "How do I get Enterprise pricing?",
              a: "Email sales@datasignalgtm.com or click 'Contact sales' on the pricing page. We typically respond within one business day.",
            },
          ].map(({ q, a }) => (
            <div key={q}>
              <p className="font-medium text-foreground">{q}</p>
              <p className="mt-1 text-sm text-muted-foreground">{a}</p>
            </div>
          ))}
        </div>
      </section>
    </article>
  );
}
