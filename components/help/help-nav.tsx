"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const sections = [
  { href: "/help", label: "Getting Started", eyebrow: "Start" },
  { href: "/help/signals", label: "Signals & Playbooks", eyebrow: "Workflow" },
  { href: "/help/webhook", label: "Webhook Integration", eyebrow: "Integrate" },
  { href: "/help/pricing", label: "Pricing & Limits", eyebrow: "Plan" },
  { href: "/help/faq", label: "FAQ", eyebrow: "Support" },
];

export function HelpNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {sections.map(({ href, label, eyebrow }) => {
        const isActive = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "ds-focus-ring group relative flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm ds-transition-muted",
              isActive
                ? "border-primary/30 bg-primary/10 text-primary shadow-[inset_2px_0_0_var(--color-primary)] ds-card-inner-glow"
                : "border-transparent text-muted-foreground hover:border-border hover:bg-surface-elevated hover:text-foreground"
            )}
          >
            <span
              className={cn(
                "ds-eyebrow w-[4rem] shrink-0 ds-transition-muted",
                isActive ? "text-primary/70" : "text-muted-foreground/60 group-hover:text-muted-foreground"
              )}
            >
              {eyebrow}
            </span>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
