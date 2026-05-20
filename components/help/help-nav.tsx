"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const sections = [
  { href: "/help", label: "Getting Started", eyebrow: "Start" },
  { href: "/help/signals", label: "Signals & Playbooks", eyebrow: "Workflow" },
  { href: "/help/webhook", label: "Webhook Integration", eyebrow: "Setup" },
  { href: "/help/pricing", label: "Pricing & Limits", eyebrow: "Plan" },
  { href: "/help/faq", label: "FAQ", eyebrow: "Support" },
];

export function HelpNav({
  variant = "sidebar",
}: {
  variant?: "sidebar" | "rail";
}) {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        variant === "rail" &&
          "flex flex-wrap gap-2 rounded-xl border border-border/60 bg-card/50 p-2 shadow-soft backdrop-blur-sm ds-card-inner-glow",
        variant === "sidebar" && "space-y-1"
      )}
    >
      {sections.map(({ href, label, eyebrow }) => {
        const isActive =
          href === "/help"
            ? pathname === "/help"
            : pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "ds-focus-ring group relative flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm ds-transition-muted motion-reduce:transition-none",
              variant === "rail" && "min-w-0 flex-1 basis-[calc(50%-0.25rem)] sm:flex-none sm:basis-auto",
              isActive
                ? "border-primary/30 bg-primary/10 text-primary shadow-[inset_2px_0_0_var(--color-primary)] ds-card-inner-glow"
                : "border-transparent text-muted-foreground hover:border-border/80 hover:bg-surface-elevated/80 hover:text-foreground"
            )}
          >
            <span
              className={cn(
                "ds-eyebrow shrink-0 ds-transition-muted",
                variant === "sidebar" && "w-20",
                variant === "rail" && "w-auto pr-0 text-[10px]",
                isActive ? "text-primary/70" : "text-muted-foreground/60 group-hover:text-muted-foreground"
              )}
            >
              {eyebrow}
            </span>
            <span className="min-w-0 truncate">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
