import Link from "next/link";
import {
  Zap,
  Target,
  BarChart3,
  Brain,
  Shield,
  ArrowRight,
  CheckCircle2,
  Github,
} from "lucide-react";
import { PLANS } from "@/lib/stripe";

// ── Small reusable components ─────────────────────────────────────────────────

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
      {children}
    </span>
  );
}

function GradientHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="bg-gradient-to-b from-zinc-100 to-zinc-400 bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-4xl">
      {children}
    </h2>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="group rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 transition-colors hover:border-zinc-700">
      <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950">
        {icon}
      </div>
      <h3 className="mb-1 text-sm font-semibold text-zinc-100">{title}</h3>
      <p className="text-sm leading-relaxed text-zinc-500">{description}</p>
    </div>
  );
}

function StepCard({
  step,
  title,
  description,
}: {
  step: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-500/10 text-xs font-bold text-emerald-300">
        {step}
      </div>
      <div>
        <h3 className="mb-1 text-sm font-semibold text-zinc-100">{title}</h3>
        <p className="text-sm leading-relaxed text-zinc-500">{description}</p>
      </div>
    </div>
  );
}

// ── Marketing page ────────────────────────────────────────────────────────────

export default function MarketingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-zinc-800/60 bg-zinc-950/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-zinc-800">
              <Zap className="h-4 w-4 text-emerald-400" />
            </div>
            <span className="text-sm font-semibold">DataSignalGTM</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden text-sm text-zinc-400 hover:text-zinc-100 sm:block"
            >
              Sign in
            </Link>
            <Link
              href="/login"
              className="rounded-lg bg-emerald-500 px-4 py-1.5 text-sm font-semibold text-zinc-950 hover:bg-emerald-400"
            >
              Start free
            </Link>
          </div>
        </div>
      </nav>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden py-24 sm:py-32">
          <div className="pointer-events-none absolute inset-0 flex items-start justify-center">
            <div className="h-[500px] w-[900px] rounded-full bg-emerald-500/5 blur-3xl" />
          </div>
          <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6">
            <Badge>
              <Zap className="h-3 w-3" />
              Now in public beta
            </Badge>
            <h1 className="mt-6 bg-gradient-to-b from-zinc-50 to-zinc-400 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-6xl lg:text-7xl">
              Turn buying signals into
              <br />
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                revenue
              </span>
              , automatically
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-zinc-400 sm:text-lg">
              DataSignalGTM ingests intent signals from every source, scores
              them against your ICP, auto-generates AI-powered playbooks, and
              keeps your reps focused on accounts that are ready to buy.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-6 py-3 text-sm font-semibold text-zinc-950 hover:bg-emerald-400"
              >
                Start for free
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="mailto:demo@datasignalgtm.com"
                className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 px-6 py-3 text-sm font-medium text-zinc-300 hover:bg-zinc-900"
              >
                Book a demo
              </a>
            </div>
            <p className="mt-4 text-xs text-zinc-600">
              Free plan · No credit card required · Setup in 5 minutes
            </p>
          </div>
        </section>

        {/* Problem → Solution */}
        <section className="border-t border-zinc-800/60 bg-zinc-900/30 py-20 sm:py-24">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <div className="grid gap-10 sm:grid-cols-2 sm:gap-16">
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-red-400">
                  The problem
                </p>
                <h2 className="mb-4 text-2xl font-bold text-zinc-100">
                  Revenue teams are drowning in noisy data
                </h2>
                <ul className="space-y-3 text-sm text-zinc-400">
                  {[
                    "Intent data scattered across 6+ tools with no unified view",
                    "Reps waste hours researching accounts that aren't ready to buy",
                    "Data quality issues quietly corrupt your ICP scoring",
                    "No systematic way to prioritise which signals to act on first",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-1 text-red-500">✕</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-emerald-400">
                  The solution
                </p>
                <h2 className="mb-4 text-2xl font-bold text-zinc-100">
                  One intelligent GTM signal layer
                </h2>
                <ul className="space-y-3 text-sm text-zinc-400">
                  {[
                    "Unified signal ingestion from any source via webhook or CSV",
                    "Automatic ICP scoring and data quality grading per account",
                    "AI-generated outreach playbooks in seconds, not hours",
                    "Smart rules engine auto-holds low-quality signals so reps focus",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Features grid */}
        <section className="py-20 sm:py-24">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <div className="mb-12 text-center">
              <GradientHeading>Everything your GTM team needs</GradientHeading>
              <p className="mt-3 text-zinc-500">
                Built for revenue operations, sales leaders, and growth teams.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <FeatureCard
                icon={<Brain className="h-5 w-5 text-emerald-400" />}
                title="AI Playbook Generator"
                description="Gemini-powered outreach playbooks tailored to each account's signals, industry, and ICP fit score. Generated in seconds."
              />
              <FeatureCard
                icon={<Target className="h-5 w-5 text-violet-400" />}
                title="ICP Scoring Engine"
                description="Composite scores combining velocity, intent, timing, and fit signals into a single prioritisation rank for every account."
              />
              <FeatureCard
                icon={<BarChart3 className="h-5 w-5 text-cyan-400" />}
                title="Data Quality Dashboard"
                description="Track DQ scores across your entire account base. Auto-flag missing fields, stale data, and coverage gaps before they hurt conversions."
              />
              <FeatureCard
                icon={<Zap className="h-5 w-5 text-amber-400" />}
                title="Background Job Processing"
                description="Playbook generation runs in the background via Inngest. Never block your team — get notified when jobs complete."
              />
              <FeatureCard
                icon={<Shield className="h-5 w-5 text-emerald-400" />}
                title="Rules Engine"
                description="Define auto-hold thresholds: accounts below your DQ floor are automatically quarantined until data improves."
              />
              <FeatureCard
                icon={<Github className="h-5 w-5 text-zinc-400" />}
                title="Webhook Ingestion"
                description="Push signals from Clearbit, 6sense, Bombora, Apollo, or any custom source via a secure authenticated webhook."
              />
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="border-t border-zinc-800/60 bg-zinc-900/30 py-20 sm:py-24">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <div className="mb-12 text-center">
              <GradientHeading>How it works</GradientHeading>
            </div>
            <div className="space-y-8">
              <StepCard
                step="1"
                title="Ingest signals from any source"
                description="Connect your intent providers, push via webhook, or import a CSV. DataSignalGTM normalises everything into a unified signal schema."
              />
              <StepCard
                step="2"
                title="Score, grade, and prioritise"
                description="Every signal is automatically scored against your ICP profile and graded for data quality. High-signal, clean accounts rise to the top."
              />
              <StepCard
                step="3"
                title="Generate AI-powered playbooks"
                description="One click queues an AI playbook via Gemini. Your reps get a personalised outreach strategy — channel, message, timing, and talking points."
              />
              <StepCard
                step="4"
                title="Approve, engage, and track"
                description="Review signals in the built-in approval workflow. Approve or reject in bulk, then track conversions back to the original signal."
              />
            </div>
          </div>
        </section>

        {/* Social proof */}
        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-5xl px-4 text-center sm:px-6">
            <p className="mb-8 text-sm font-medium uppercase tracking-wider text-zinc-600">
              Trusted by revenue teams at
            </p>
            <div className="flex flex-wrap items-center justify-center gap-8 opacity-30 grayscale">
              {["Acme Corp", "Buildware", "CloudStack", "DevEx", "Empirica", "FusionHQ"].map(
                (name) => (
                  <span key={name} className="text-base font-bold text-zinc-400">
                    {name}
                  </span>
                )
              )}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section
          id="pricing"
          className="border-t border-zinc-800/60 bg-zinc-900/30 py-20 sm:py-24"
        >
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <div className="mb-12 text-center">
              <GradientHeading>Simple, transparent pricing</GradientHeading>
              <p className="mt-3 text-zinc-500">Start free. Upgrade when you need more.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {PLANS.map((plan) => (
                <div
                  key={plan.id}
                  className={`relative flex flex-col rounded-xl border p-6 ${
                    plan.highlighted
                      ? "border-emerald-500/60 bg-emerald-950/20"
                      : "border-zinc-800 bg-zinc-900"
                  }`}
                >
                  {plan.highlighted && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-3 py-1 text-[11px] font-semibold text-zinc-950">
                        <Zap className="h-3 w-3" />
                        Most popular
                      </span>
                    </div>
                  )}
                  <div className="mb-4">
                    <h3 className="text-base font-semibold text-zinc-100">{plan.name}</h3>
                    <div className="mt-3 flex items-end gap-1.5">
                      <span className="text-3xl font-bold text-zinc-100">{plan.price}</span>
                      <span className="mb-1 text-xs text-zinc-500">{plan.priceSub}</span>
                    </div>
                  </div>
                  <ul className="mb-6 flex-1 space-y-2">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-xs text-zinc-300">
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  {plan.id === "enterprise" ? (
                    <a
                      href="mailto:sales@datasignalgtm.com"
                      className="block rounded-lg border border-zinc-700 px-3 py-2 text-center text-xs font-medium text-zinc-300 hover:bg-zinc-800"
                    >
                      {plan.cta}
                    </a>
                  ) : (
                    <Link
                      href="/login"
                      className={`block rounded-lg px-3 py-2 text-center text-xs font-semibold ${
                        plan.highlighted
                          ? "bg-emerald-400 text-zinc-950 hover:bg-emerald-300"
                          : "border border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                      }`}
                    >
                      {plan.cta}
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-24">
          <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
            <GradientHeading>Ready to accelerate your pipeline?</GradientHeading>
            <p className="mt-4 text-zinc-500">
              Join hundreds of GTM teams using DataSignalGTM to close more
              deals with less noise.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-6 py-3 text-sm font-semibold text-zinc-950 hover:bg-emerald-400"
              >
                Start for free — no credit card
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/60 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2 text-sm text-zinc-600">
            <Zap className="h-4 w-4 text-emerald-500/60" />
            DataSignalGTM © {new Date().getFullYear()}
          </div>
          <div className="flex gap-6 text-xs text-zinc-600">
            <Link href="/help" className="hover:text-zinc-400">
              Docs
            </Link>
            <a
              href="mailto:hello@datasignalgtm.com"
              className="hover:text-zinc-400"
            >
              Contact
            </a>
            <Link href="/login" className="hover:text-zinc-400">
              Sign in
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
