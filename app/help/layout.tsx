import Link from "next/link";
import { ArrowLeft, BookOpen, LifeBuoy, Radio, Webhook } from "lucide-react";
import { Card } from "@/components/ui/card";

const sections = [
  { href: "/help", label: "Getting Started", eyebrow: "Start" },
  { href: "/help/signals", label: "Signals & Playbooks", eyebrow: "Workflow" },
  { href: "/help/webhook", label: "Webhook Integration", eyebrow: "Integrate" },
  { href: "/help/pricing", label: "Pricing & Limits", eyebrow: "Plan" },
  { href: "/help/faq", label: "FAQ", eyebrow: "Support" },
];

export default function HelpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="ds-page min-h-screen text-foreground">
      <nav className="sticky top-0 z-40 border-b border-border bg-background/82 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </Link>
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <BookOpen className="h-4 w-4 text-primary" />
            Documentation
          </div>
        </div>
      </nav>

      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[17rem_1fr]">
        <aside className="hidden shrink-0 lg:block">
          <nav className="sticky top-24 space-y-2">
            <Card className="mb-4 bg-card/70 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                <LifeBuoy className="h-5 w-5" />
              </div>
              <h2 className="ds-heading mt-3 text-base font-semibold">
                Help Center
              </h2>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Practical guides for setup, signal review, and billing.
              </p>
            </Card>
            {sections.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="ds-focus-ring block rounded-md border border-transparent px-3 py-2 text-sm text-muted-foreground hover:border-border hover:bg-surface-elevated hover:text-foreground"
              >
                {label}
              </Link>
            ))}
          </nav>
        </aside>

        <main id="main-content" tabIndex={-1} className="min-w-0">
          <div className="mb-6 grid gap-3 sm:grid-cols-2">
            <Link
              href="/help/signals"
              className="ds-focus-ring ds-pressable rounded-xl border border-border bg-card/70 p-4 hover:bg-surface-elevated"
            >
              <Radio className="h-4 w-4 text-primary" />
              <div className="mt-2 text-sm font-medium">Understand signal lifecycle</div>
              <p className="mt-1 text-xs text-muted-foreground">
                Status, playbooks, rules, and what reps should do next.
              </p>
            </Link>
            <Link
              href="/help/webhook"
              className="ds-focus-ring ds-pressable rounded-xl border border-border bg-card/70 p-4 hover:bg-surface-elevated"
            >
              <Webhook className="h-4 w-4 text-primary" />
              <div className="mt-2 text-sm font-medium">Connect signal sources</div>
              <p className="mt-1 text-xs text-muted-foreground">
                Endpoint, auth, schema, and cURL examples for ingestion.
              </p>
            </Link>
          </div>
          <div className="prose prose-invert prose-zinc max-w-none rounded-2xl border border-border bg-card/60 p-6 prose-headings:ds-heading prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-code:border prose-code:border-border prose-code:bg-background/60 prose-code:text-foreground">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
