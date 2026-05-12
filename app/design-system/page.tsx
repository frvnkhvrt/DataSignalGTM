import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  CircleAlert,
  Clock,
  Layers3,
  Sparkles,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Reveal, Stagger, StaggerItem } from "@/components/ui/motion";
import { StatusPill } from "@/components/status-pill";

export const metadata = {
  title: "Design System - DataSignalGTM",
};

const colorTokens = [
  ["Background", "bg-background", "Core app canvas"],
  ["Card", "bg-card", "Primary content surface"],
  ["Surface", "bg-surface", "Nested product panels"],
  ["Primary", "bg-primary", "Brand action and focus"],
  ["Success", "bg-success", "Approved and healthy"],
  ["Warning", "bg-warning", "Held and attention"],
  ["Danger", "bg-destructive", "Rejected and destructive"],
  ["Info", "bg-info", "System and usage context"],
] as const;

const typeScale = [
  ["Display", "ds-heading text-5xl font-semibold tracking-[-0.05em]", "Launch-ready hero moments"],
  ["Page title", "ds-heading text-3xl font-semibold tracking-[-0.04em]", "Primary app hierarchy"],
  ["Section", "text-lg font-semibold tracking-[-0.02em]", "Card and content groups"],
  ["Body", "text-sm leading-6 text-muted-foreground", "Dense product copy"],
  ["Caption", "text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground", "Labels and metadata"],
] as const;

const productionChecklist = [
  "Keyboard: tab through sidebar, top bar, command palette, tables, dialogs, billing, and help without traps.",
  "Screen reader: verify Signals approval announces status/toast feedback and table selected counts.",
  "Focus: opening and closing command palette, onboarding, billing portal actions, and playbook panels returns focus predictably.",
  "Motion: OS-level reduced motion disables transitions, shimmer, and page movement without hiding content.",
  "Performance: dashboard charts load dynamically; table density changes do not reflow full pages unnecessarily.",
  "Responsive: mobile bottom navigation, table horizontal scroll, and dialog touch targets remain usable.",
  "Print: usage reports, help docs, and playbook-like panels print without navigation chrome.",
] as const;

const manualTestingNotes = [
  "Signals approval: use keyboard only to filter, approve a signal, open the toast action, and confirm focus returns to the triggering control or panel.",
  "Onboarding: run Tab and Shift+Tab through each step; Escape should dismiss, and reduced motion should remove step animation.",
  "Billing: navigate every plan action by keyboard, confirm current-plan state is announced visually and textually, and verify errors use toast feedback.",
] as const;

export default function DesignSystemPage() {
  return (
    <main id="main-content" tabIndex={-1} className="ds-page py-10">
      <div className="ds-container space-y-10">
        <Reveal>
          <div className="flex flex-col gap-6 border-b border-border pb-8 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-3xl">
              <Link
                href="/"
                className="mb-6 inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to product
              </Link>
              <div className="ds-eyebrow">UX-1 Foundation</div>
              <h1 className="ds-heading ds-gradient-text mt-3 text-5xl font-semibold sm:text-6xl">
                DataSignalGTM Design System
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
                Dark-first, signal-dense, and intentionally quiet. The system uses
                emerald as the brand action color, warm semantic accents, disciplined
                radii, and motion that clarifies state without distracting from work.
              </p>
            </div>
            <Badge variant="brand" className="w-fit">
              <Sparkles className="h-3 w-3" />
              Phase UX-1
            </Badge>
          </div>
        </Reveal>

        <section className="space-y-4">
          <div>
            <p className="ds-eyebrow">Color</p>
            <h2 className="ds-heading mt-2 text-2xl font-semibold">Semantic Tokens</h2>
          </div>
          <Stagger className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {colorTokens.map(([name, swatch, description]) => (
              <StaggerItem key={name}>
                <Card className="h-full bg-card/80">
                  <CardContent className="p-4">
                    <div className={`mb-4 h-20 rounded-lg border border-border ${swatch}`} />
                    <div className="font-medium text-foreground">{name}</div>
                    <p className="mt-1 text-xs text-muted-foreground">{description}</p>
                  </CardContent>
                </Card>
              </StaggerItem>
            ))}
          </Stagger>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <Card elevated className="bg-card/82">
            <CardHeader>
              <p className="ds-eyebrow">Typography</p>
              <CardTitle className="ds-heading text-2xl">Hierarchy Scale</CardTitle>
              <CardDescription>
                Inter carries dense interface copy. Geist is reserved for display
                headings and product-level hierarchy.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {typeScale.map(([label, className, usage]) => (
                <div key={label} className="border-b border-border pb-4 last:border-0 last:pb-0">
                  <div className="mb-2 text-xs text-muted-foreground">{label}</div>
                  <div className={className}>Revenue signal clarity</div>
                  <p className="mt-1 text-xs text-muted-foreground">{usage}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card elevated className="bg-card/82">
            <CardHeader>
              <p className="ds-eyebrow">Components</p>
              <CardTitle className="ds-heading text-2xl">Core Controls</CardTitle>
              <CardDescription>
                Shared variants now define hover, focus, disabled, and semantic states.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex flex-wrap gap-2">
                <Button>Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="success" size="sm">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Success
                </Button>
                <Button variant="warning" size="sm">
                  <Clock className="h-3.5 w-3.5" />
                  Warning
                </Button>
                <Button variant="destructive" size="sm">
                  <CircleAlert className="h-3.5 w-3.5" />
                  Danger
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input placeholder="Search accounts..." />
                <Select defaultValue="approved">
                  <option value="approved">Approved</option>
                  <option value="held">Held</option>
                  <option value="pending">Pending</option>
                </Select>
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusPill status="approved" />
                <StatusPill status="held" />
                <StatusPill status="pending" />
                <StatusPill status="rejected" />
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-4">
          <div>
            <p className="ds-eyebrow">Surfaces & Motion</p>
            <h2 className="ds-heading mt-2 text-2xl font-semibold">Product Composition</h2>
          </div>
          <Stagger className="grid gap-4 lg:grid-cols-3">
            {[
              ["Signal review", "Card surfaces use one border tone, soft elevation, and semantic action color."],
              ["Data quality", "Status is encoded with success, warning, and danger tokens instead of raw palette classes."],
              ["Motion", "Reveal and stagger patterns use a 420ms premium ease and respect reduced motion."],
            ].map(([title, copy]) => (
              <StaggerItem key={title}>
                <Card className="h-full bg-card/80 transition-colors hover:bg-surface-elevated/80">
                  <CardHeader>
                    <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                      <Layers3 className="h-4 w-4" />
                    </div>
                    <CardTitle>{title}</CardTitle>
                    <CardDescription>{copy}</CardDescription>
                  </CardHeader>
                </Card>
              </StaggerItem>
            ))}
          </Stagger>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
          <Card elevated className="bg-card/82">
            <CardHeader>
              <p className="ds-eyebrow">Production Readiness</p>
              <CardTitle className="ds-heading text-2xl">
                UI/UX Checklist
              </CardTitle>
              <CardDescription>
                Final acceptance criteria for accessibility, performance, motion,
                responsive behavior, and print readiness.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm text-muted-foreground">
                {productionChecklist.map((item) => (
                  <li key={item} className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card elevated className="bg-card/82">
            <CardHeader>
              <p className="ds-eyebrow">Manual A11y Notes</p>
              <CardTitle className="ds-heading text-2xl">
                Key Flow Checks
              </CardTitle>
              <CardDescription>
                Short screen-reader and keyboard scripts for the highest-risk
                production flows.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal space-y-3 pl-4 text-sm text-muted-foreground">
                {manualTestingNotes.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
