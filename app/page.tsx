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
  AlertTriangle,
  DatabaseZap,
  FilterX,
  SearchX,
  Sparkles,
  Workflow,
  CircleDashed,
  Layers3,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Reveal, Stagger, StaggerItem } from "@/components/ui/motion";
import { cn } from "@/lib/utils";
import { PLANS } from "@/lib/stripe";

// ── Small reusable components ─────────────────────────────────────────────────

function GradientHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="ds-heading ds-gradient-text text-pretty text-3xl font-semibold tracking-[-0.045em] sm:text-5xl">
      {children}
    </h2>
  );
}

const sectionLabelClass = "ds-eyebrow mb-4";
const sectionContainerClass = "mx-auto max-w-6xl px-4 sm:px-6";
const sectionDividerClass =
  "pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent";
const premiumButtonClass = "shadow-glow hover:shadow-glow-strong";

const problemItems = [
  {
    icon: DatabaseZap,
    title: "Signals fracture across your stack",
    description:
      "Intent, enrichment, CRM activity, and product usage live in disconnected systems with no unified GTM view.",
  },
  {
    icon: SearchX,
    title: "Reps research the wrong accounts",
    description:
      "Hours disappear into manual account inspection before anyone knows whether the signal is worth acting on.",
  },
  {
    icon: AlertTriangle,
    title: "Dirty data distorts prioritisation",
    description:
      "Missing fields, stale firmographics, and low-confidence inputs quietly corrupt scoring and routing.",
  },
  {
    icon: FilterX,
    title: "No shared threshold for action",
    description:
      "Revenue teams debate signal quality instead of moving the right accounts into play with confidence.",
  },
] as const;

const solutionItems = [
  {
    icon: Layers3,
    title: "One signal layer for every source",
    description:
      "Normalize webhook, CSV, enrichment, and intent data into a single account-level operating view.",
  },
  {
    icon: Target,
    title: "Prioritisation your team can trust",
    description:
      "ICP fit, timing, velocity, and data quality roll into clear rankings that tell reps where to focus first.",
  },
  {
    icon: Sparkles,
    title: "AI playbooks in seconds",
    description:
      "Every qualified account gets a tailored outreach plan with context, messaging, timing, and talking points.",
  },
  {
    icon: Workflow,
    title: "Rules that protect your pipeline",
    description:
      "Low-quality signals are held automatically while high-confidence accounts move into approval and action.",
  },
] as const;

const featureItems = [
  {
    icon: Brain,
    iconClass: "text-primary",
    title: "AI Playbook Generator",
    description:
      "Gemini-powered outreach playbooks tailored to each account's signals, industry, and ICP fit score. Generated in seconds.",
  },
  {
    icon: Target,
    iconClass: "text-info",
    title: "ICP Scoring Engine",
    description:
      "Composite scores combining velocity, intent, timing, and fit signals into a single prioritisation rank for every account.",
  },
  {
    icon: BarChart3,
    iconClass: "text-info",
    title: "Data Quality Dashboard",
    description:
      "Track DQ scores across your entire account base. Auto-flag missing fields, stale data, and coverage gaps before they hurt conversions.",
  },
  {
    icon: Zap,
    iconClass: "text-warning",
    title: "Background Job Processing",
    description:
      "Playbook generation runs in the background via Inngest. Never block your team — get notified when jobs complete.",
  },
  {
    icon: Shield,
    iconClass: "text-primary",
    title: "Rules Engine",
    description:
      "Define auto-hold thresholds: accounts below your DQ floor are automatically quarantined until data improves.",
  },
  {
    icon: Github,
    iconClass: "text-muted-foreground",
    title: "Webhook Ingestion",
    description:
      "Push signals from Clearbit, 6sense, Bombora, Apollo, or any custom source via a secure authenticated webhook.",
  },
] as const;

const workflowSteps = [
  {
    step: "1",
    title: "Ingest signals from any source",
    description:
      "Connect your intent providers, push via webhook, or import a CSV. DataSignalGTM normalises everything into a unified signal schema.",
  },
  {
    step: "2",
    title: "Score, grade, and prioritise",
    description:
      "Every signal is automatically scored against your ICP profile and graded for data quality. High-signal, clean accounts rise to the top.",
  },
  {
    step: "3",
    title: "Generate AI-powered playbooks",
    description:
      "One click queues an AI playbook via Gemini. Your reps get a personalised outreach strategy — channel, message, timing, and talking points.",
  },
  {
    step: "4",
    title: "Approve, engage, and track",
    description:
      "Review signals in the built-in approval workflow. Approve or reject in bulk, then track conversions back to the original signal.",
  },
] as const;

const socialProofNames = [
  "Growthware",
  "CloudStack",
  "Buildforce",
  "DevEx",
  "Empirica",
  "FusionHQ",
] as const;

function FeatureCard({
  icon,
  iconClass,
  title,
  description,
}: {
  icon: LucideIcon;
  iconClass: string;
  title: string;
  description: string;
}) {
  const Icon = icon;

  return (
    <Card className="group relative h-full overflow-hidden border-border/70 bg-card/65 shadow-soft backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-primary/35 hover:bg-surface-elevated/75 hover:shadow-elevated">
      <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-primary/45 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <CardContent className="p-5 sm:p-6">
        <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/15 bg-primary/10 shadow-glow transition-transform duration-300 group-hover:scale-105">
          <Icon className={cn("h-5 w-5", iconClass)} />
        </div>
        <h3 className="mb-2 text-base font-semibold tracking-[-0.02em] text-foreground">
          {title}
        </h3>
        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
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
    <Card className="group relative overflow-hidden border-border/70 bg-card/60 shadow-soft backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:bg-surface-elevated/70">
      <CardContent className="flex gap-5 p-5 sm:p-6">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-primary/35 bg-primary/10 text-sm font-semibold text-primary shadow-glow">
          {step}
        </div>
        <div>
          <h3 className="mb-2 text-base font-semibold tracking-[-0.02em] text-foreground">
            {title}
          </h3>
          <p className="text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Marketing page ────────────────────────────────────────────────────────────

export default function MarketingPage() {
  return (
    <div className="ds-page min-h-screen overflow-hidden text-foreground">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border/70 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 shadow-glow">
              <Zap className="h-4 w-4 text-primary" />
            </div>
            <span className="ds-heading text-sm font-semibold tracking-[-0.02em]">
              DataSignalGTM
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground sm:block"
            >
              Sign in
            </Link>
            <Link
              href="/login"
              className={cn(buttonVariants({ size: "sm" }), "rounded-lg px-4")}
            >
              Start free
            </Link>
          </div>
        </div>
      </nav>

      <main id="main-content" tabIndex={-1}>
        {/* Hero */}
        <section className="relative overflow-hidden py-24 sm:py-32 lg:py-40">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-[-10rem] h-[42rem] w-[72rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
            <div className="absolute right-[-10rem] top-32 h-72 w-72 rounded-full bg-info/10 blur-3xl" />
            <div className="absolute left-[-8rem] top-56 h-72 w-72 rounded-full bg-success/10 blur-3xl" />
            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
          </div>
          <div className="relative mx-auto max-w-5xl px-4 text-center sm:px-6">
            <Reveal>
              <Badge variant="brand" className="px-3 py-1 shadow-glow">
                <Zap className="h-3 w-3" />
                Now in public beta
              </Badge>
              <h1 className="ds-heading ds-gradient-text mx-auto mt-7 max-w-4xl text-balance text-5xl font-semibold tracking-[-0.065em] sm:text-7xl lg:text-8xl">
                Turn buying signals into pipeline ready to close
              </h1>
              <p className="mx-auto mt-7 max-w-[42rem] text-pretty text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
                DataSignalGTM detects accounts with real buying intent,
                prioritises the best-fit opportunities, and turns every signal
                into an actionable playbook so your team sells with focus.
              </p>
              <div className="mt-11 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
                <Link
                  href="/demo"
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "h-auto rounded-xl px-8 py-4 text-base font-semibold",
                    premiumButtonClass
                  )}
                >
                  Explore live demo
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/login"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" }),
                    "h-auto rounded-xl bg-background/50 px-8 py-4 text-base font-medium backdrop-blur hover:border-primary/25"
                  )}
                >
                  Sign in to your workspace
                </Link>
              </div>
              <p className="mt-5 text-xs text-muted-foreground/75">
                No credit card required · Instant demo access
              </p>
            </Reveal>
          </div>
        </section>

        {/* Problem → Solution */}
        <section className="relative overflow-hidden border-y border-border/70 bg-surface/30 py-24 sm:py-28">
          <div className={sectionDividerClass} />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgb(16_185_129_/_0.1),transparent_34rem)]" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background/50 to-transparent" />
          <div className={cn(sectionContainerClass, "relative")}>
            <Reveal>
              <div className="mx-auto mb-14 max-w-3xl text-center sm:mb-16">
                <p className={sectionLabelClass}>The GTM operating gap</p>
                <GradientHeading>From scattered intent to decisive action</GradientHeading>
                <p className="mx-auto mt-5 max-w-2xl text-pretty text-base leading-7 text-muted-foreground">
                  DataSignalGTM turns noisy buying signals into a governed
                  workflow your revenue team can trust.
                </p>
              </div>
            </Reveal>

            <Reveal>
              <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_6rem_minmax(0,1fr)] lg:items-center">
                <ComparisonColumn
                  label="The problem"
                  title="Revenue teams drown in noisy data"
                  tone="destructive"
                  items={problemItems}
                />

                <div className="flex items-center justify-center py-1 lg:hidden">
                  <div className="flex items-center gap-3 rounded-full border border-primary/25 bg-background/55 px-3 py-2 text-primary shadow-glow backdrop-blur">
                    <span className="h-px w-10 bg-gradient-to-r from-transparent to-primary/45" />
                    <ArrowRight className="h-4 w-4" />
                    <span className="h-px w-10 bg-gradient-to-r from-primary/45 to-transparent" />
                  </div>
                </div>

                <div className="relative hidden h-full min-h-[34rem] items-center justify-center lg:flex">
                  <div className="absolute inset-y-10 left-1/2 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-border to-transparent" />
                  <div className="absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-2xl" />
                  <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full border border-primary/35 bg-background/65 text-primary shadow-glow backdrop-blur-xl">
                    <ArrowRight className="h-6 w-6" />
                  </div>
                </div>

                <ComparisonColumn
                  label="The solution"
                  title="One intelligent GTM signal layer"
                  tone="success"
                  items={solutionItems}
                />
              </div>
            </Reveal>
          </div>
        </section>

        {/* Features grid */}
        <section className="relative overflow-hidden py-24 sm:py-28">
          <div className="pointer-events-none absolute left-[-14rem] top-1/3 h-80 w-80 rounded-full bg-info/10 blur-3xl" />
          <div className={cn(sectionContainerClass, "relative")}>
            <Reveal>
              <div className="mx-auto mb-14 max-w-3xl text-center">
                <p className={sectionLabelClass}>Platform</p>
                <GradientHeading>Everything your GTM team needs</GradientHeading>
                <p className="mt-5 text-base leading-7 text-muted-foreground">
                  Built for revenue operations, sales leaders, and growth teams.
                </p>
              </div>
            </Reveal>
            <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featureItems.map((feature) => (
                <StaggerItem key={feature.title}>
                  <FeatureCard {...feature} />
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </section>

        {/* How it works */}
        <section className="relative overflow-hidden border-y border-border/70 bg-surface/30 py-24 sm:py-28">
          <div className={sectionDividerClass} />
          <div className="pointer-events-none absolute right-[-12rem] top-10 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative mx-auto max-w-4xl px-4 sm:px-6">
            <Reveal>
              <div className="mx-auto mb-14 max-w-3xl text-center">
                <p className={sectionLabelClass}>Workflow</p>
                <GradientHeading>How it works</GradientHeading>
              </div>
            </Reveal>
            <Stagger className="space-y-4">
              {workflowSteps.map((step) => (
                <StaggerItem key={step.step}>
                  <StepCard {...step} />
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </section>

        {/* Social proof */}
        <section className="relative py-20">
          <Reveal>
            <div className="mx-auto max-w-5xl px-4 text-center sm:px-6">
              <p className="mb-8 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground/70">
                Trusted by revenue teams at
              </p>
              <Stagger className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                {socialProofNames.map((name) => (
                  <StaggerItem key={name}>
                    <div className="rounded-2xl border border-border/60 bg-card/45 px-4 py-3 shadow-soft backdrop-blur transition-colors duration-300 hover:border-primary/20 hover:bg-surface-elevated/60">
                      <span className="ds-heading text-sm font-semibold tracking-[-0.03em] text-muted-foreground">
                        {name}
                      </span>
                    </div>
                  </StaggerItem>
                ))}
              </Stagger>
            </div>
          </Reveal>
        </section>

        {/* Pricing */}
        <section
          id="pricing"
          className="relative overflow-hidden border-y border-border/70 bg-surface/30 py-24 sm:py-28"
        >
          <div className={sectionDividerClass} />
          <div className="pointer-events-none absolute left-1/2 top-12 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
          <div className={cn(sectionContainerClass, "relative")}>
            <Reveal>
              <div className="mx-auto mb-14 max-w-3xl text-center">
                <p className={sectionLabelClass}>Pricing</p>
                <GradientHeading>Simple, transparent pricing</GradientHeading>
                <p className="mt-5 text-base leading-7 text-muted-foreground">
                  Start free. Upgrade when you need more.
                </p>
              </div>
            </Reveal>
            <Stagger className="grid gap-4 pt-5 sm:grid-cols-2 lg:grid-cols-3">
              {PLANS.map((plan) => (
                <StaggerItem key={plan.id}>
                  <Card
                    elevated={plan.highlighted}
                    className={cn(
                      "group relative flex h-full flex-col border-border/70 bg-card/65 p-6 shadow-soft backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:bg-surface-elevated/75 hover:shadow-elevated",
                      plan.highlighted &&
                        "border-primary/60 bg-primary/10 pt-9 shadow-[0_1px_0_rgb(255_255_255_/_0.05)_inset,0_30px_90px_rgb(0_0_0_/_0.45),0_0_80px_rgb(16_185_129_/_0.18)]"
                    )}
                  >
                    <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-primary/55 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    {plan.highlighted && (
                      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/20 blur-3xl" />
                    )}
                    {plan.highlighted && (
                      <div className="absolute -top-px left-1/2 -translate-x-1/2 -translate-y-1/2">
                        <Badge
                          className="bg-primary px-3 py-1 text-[11px] font-semibold text-primary-foreground shadow-glow"
                          shape="pill"
                        >
                          <Zap className="h-3 w-3" />
                          Most popular
                        </Badge>
                      </div>
                    )}
                    <div className="relative mb-5">
                      <h3 className="text-base font-semibold text-foreground">
                        {plan.name}
                      </h3>
                      <div className="mt-3 flex items-end gap-1.5">
                        <span className="ds-heading text-3xl font-semibold tracking-[-0.04em] text-foreground">
                          {plan.price}
                        </span>
                        <span className="mb-1 text-xs text-muted-foreground">
                          {plan.priceSub}
                        </span>
                      </div>
                    </div>
                    <ul className="relative mb-6 flex-1 space-y-2 border-t border-border/70 pt-5">
                      {plan.features.map((f) => (
                        <li
                          key={f}
                          className="flex items-start gap-2 text-xs leading-5 text-muted-foreground"
                        >
                          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    {plan.id === "enterprise" ? (
                      <a
                        href="mailto:sales@datasignalgtm.com"
                        className={cn(
                          buttonVariants({ variant: "outline", size: "sm" }),
                          "relative w-full rounded-lg bg-background/45"
                        )}
                      >
                        {plan.cta}
                      </a>
                    ) : (
                      <Link
                        href="/login"
                        className={cn(
                          buttonVariants({
                            variant: plan.highlighted ? "default" : "outline",
                            size: "sm",
                          }),
                          "relative w-full rounded-lg",
                          plan.highlighted && premiumButtonClass
                        )}
                      >
                        {plan.cta}
                      </Link>
                    )}
                  </Card>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </section>

        {/* Final CTA */}
        <section className="relative py-24 sm:py-32">
          <div className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-72 max-w-3xl rounded-full bg-primary/10 blur-3xl" />
          <Reveal>
            <div className="mx-auto max-w-4xl px-4 sm:px-6">
              <div className="relative overflow-hidden rounded-[2rem] border border-primary/20 bg-card/65 px-6 py-12 text-center shadow-elevated backdrop-blur-xl sm:px-12 sm:py-16">
                <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent" />
                <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
                <div className="relative">
                  <GradientHeading>Ready to accelerate your pipeline?</GradientHeading>
                  <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-muted-foreground">
                    Join hundreds of GTM teams using DataSignalGTM to close more
                    deals with less noise.
                  </p>
                  <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
                    <Link
                      href="/login"
                      className={cn(
                        buttonVariants({ size: "lg" }),
                        "h-auto rounded-xl px-7 py-3",
                        premiumButtonClass
                      )}
                    >
                      Start for free — no credit card
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/70 bg-background/55 py-10 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-primary/20 bg-primary/10">
              <Zap className="h-3.5 w-3.5 text-primary/80" />
            </span>
            DataSignalGTM © {new Date().getFullYear()}
          </div>
          <div className="flex gap-6 text-xs text-muted-foreground">
            <Link
              href="/help"
              className="transition-colors hover:text-foreground"
            >
              Docs
            </Link>
            <a
              href="mailto:hello@datasignalgtm.com"
              className="transition-colors hover:text-foreground"
            >
              Contact
            </a>
            <Link
              href="/login"
              className="transition-colors hover:text-foreground"
            >
              Sign in
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function ComparisonColumn({
  label,
  title,
  tone,
  items,
}: {
  label: string;
  title: string;
  tone: "destructive" | "success";
  items: readonly {
    icon: LucideIcon;
    title: string;
    description: string;
  }[];
}) {
  const isProblem = tone === "destructive";
  const AccentIcon = isProblem ? CircleDashed : CheckCircle2;

  return (
    <Card
      elevated
      className={cn(
        "relative overflow-hidden rounded-[1.75rem] bg-card/65 p-4 shadow-elevated backdrop-blur-xl sm:p-5",
        isProblem
          ? "border-destructive/25"
          : "border-success/35 shadow-[0_1px_0_rgb(255_255_255_/_0.04)_inset,0_24px_80px_rgb(0_0_0_/_0.38),0_0_70px_rgb(16_185_129_/_0.12)]"
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full blur-3xl",
          isProblem ? "bg-destructive/10" : "bg-success/15"
        )}
      />
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 h-px",
          isProblem
            ? "bg-gradient-to-r from-transparent via-destructive/70 to-transparent"
            : "bg-gradient-to-r from-transparent via-success/70 to-transparent"
        )}
      />
      <div className="relative mb-6 rounded-[1.35rem] border border-border/70 bg-background/35 p-5">
        <Badge
          variant={isProblem ? "destructive" : "success"}
          className="mb-4 px-3 py-1"
        >
          <AccentIcon className="h-3 w-3" />
          {label}
        </Badge>
        <h3 className="ds-heading text-2xl font-semibold tracking-[-0.04em] text-foreground sm:text-3xl">
          {title}
        </h3>
      </div>
      <Stagger className="space-y-3">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <StaggerItem key={item.title}>
              <div
                className={cn(
                  "group relative overflow-hidden rounded-2xl border bg-background/35 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:bg-surface-elevated/75 hover:shadow-soft",
                  isProblem
                    ? "border-destructive/20 hover:border-destructive/40"
                    : "border-success/20 hover:border-success/40"
                )}
              >
                <div
                  className={cn(
                    "pointer-events-none absolute inset-y-0 left-0 w-1",
                    isProblem ? "bg-destructive/50" : "bg-success/60"
                  )}
                />
                <div className="flex gap-4 pl-1">
                  <div
                    className={cn(
                      "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border shadow-soft transition-transform duration-300 group-hover:scale-105",
                      isProblem
                        ? "border-destructive/25 bg-destructive/10 text-destructive"
                        : "border-success/25 bg-success/10 text-success"
                    )}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold tracking-[-0.01em] text-foreground">
                      {item.title}
                    </h4>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            </StaggerItem>
          );
        })}
      </Stagger>
    </Card>
  );
}
