"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  BarChart3,
  BookOpen,
  Building2,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  LayoutDashboard,
  Radio,
} from "lucide-react";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { spring } from "@/components/ui/motion";
import { cn } from "@/lib/utils";

const navGroups = [
  {
    label: "Workspace",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/signals", label: "Signals", icon: Radio },
      { href: "/accounts", label: "Accounts", icon: Building2 },
    ],
  },
  {
    label: "Operations",
    items: [
      { href: "/admin/usage", label: "AI Usage", icon: BarChart3 },
      { href: "/settings/billing", label: "Billing", icon: CreditCard },
    ],
  },
] as const;

const PILL_LAYOUT_ID = "sidebar-active-pill";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("datasignalgtm.sidebar.collapsed") === "true";
  });

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--sidebar-width",
      collapsed ? "5.25rem" : "15rem"
    );
    window.localStorage.setItem(
      "datasignalgtm.sidebar.collapsed",
      String(collapsed)
    );
  }, [collapsed]);

  return (
    <aside className="fixed inset-x-0 bottom-0 z-20 flex h-16 border-t border-border bg-background/88 backdrop-blur-xl transition-[width] duration-[var(--ds-duration-smooth)] ease-[var(--ease-premium)] sm:inset-x-auto sm:inset-y-0 sm:left-0 sm:h-auto sm:w-[var(--sidebar-width)] sm:flex-col sm:border-r-0 sm:border-t-0 sm:[box-shadow:1px_0_0_var(--color-border)]">
      <div
        className={cn(
          "hidden sm:flex ds-chrome-divider",
          collapsed
            ? "flex-col items-center gap-2.5 px-2 pb-3 pt-3"
            : "h-14 flex-row items-center gap-2 px-4"
        )}
      >
        <div
          className={cn(
            "flex shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 ds-shadow-brand-well",
            collapsed ? "h-9 w-9" : "h-7 w-7 rounded-md"
          )}
        >
          <Activity className={cn("text-primary", collapsed ? "h-[18px] w-[18px]" : "h-4 w-4")} />
        </div>
        <span
          className={cn(
            "font-display text-sm font-semibold tracking-[-0.02em] text-foreground transition-opacity duration-[var(--ds-duration-smooth)] ease-[var(--ease-premium)]",
            collapsed ? "sr-only" : "min-w-0 flex-1 truncate opacity-100"
          )}
        >
          DataSignalGTM
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            "hidden shrink-0 sm:inline-flex",
            collapsed ? "h-8 w-8 rounded-lg text-muted-foreground hover:bg-surface-elevated hover:text-foreground" : "ml-auto h-8 w-8"
          )}
          onClick={() => setCollapsed((v) => !v)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      <nav className="grid flex-1 grid-cols-3 gap-1 px-2 py-2 sm:block sm:space-y-5 sm:px-3 sm:py-4">
        {navGroups.map((group) => (
          <div key={group.label} className="contents sm:block">
            <div
              className={`hidden px-2 pb-1.5 pt-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/60 sm:block ${
                collapsed ? "sr-only" : ""
              }`}
            >
              {group.label}
            </div>
            <div className="contents sm:block sm:space-y-0.5">
              {group.items.map(({ href, label, icon: Icon }) => {
                const active =
                  href === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    aria-current={active ? "page" : undefined}
                    title={collapsed ? label : undefined}
                    onFocus={() => router.prefetch(href)}
                    onMouseEnter={() => router.prefetch(href)}
                    className={`ds-focus-ring relative flex flex-col items-center justify-center gap-1 overflow-hidden rounded-md border-t-2 px-2 py-2 text-[11px] sm:flex-row sm:gap-3 sm:border-l-2 sm:border-t-0 sm:text-sm ${
                      collapsed ? "sm:justify-center sm:px-2" : "sm:justify-start sm:px-3"
                    } ${
                      active
                        ? "border-primary text-foreground sm:border-transparent"
                        : "border-transparent text-muted-foreground hover:bg-surface-elevated hover:text-foreground"
                    }`}
                  >
                    {/* Desktop animated pill — slides between active items via layoutId */}
                    {active && (
                      <motion.span
                        layoutId={PILL_LAYOUT_ID}
                        aria-hidden="true"
                        className="ds-nav-active-pill pointer-events-none absolute inset-0 hidden rounded-md border-l-2 border-primary bg-gradient-to-r from-primary/14 to-primary/6 sm:block"
                        transition={spring.sidebarPill}
                      />
                    )}
                    <Icon className="relative z-10 h-4 w-4 shrink-0" />
                    <span className={`relative z-10 ${collapsed ? "sm:sr-only" : ""}`}>
                      {label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        <div className="hidden sm:mt-auto sm:block sm:pt-4 ds-chrome-edge-top">
          <Link
            href="/help"
            title={collapsed ? "Help" : undefined}
            onFocus={() => router.prefetch("/help")}
            onMouseEnter={() => router.prefetch("/help")}
            className={`ds-focus-ring relative flex items-center gap-3 overflow-hidden rounded-md border-l-2 border-transparent py-2 text-sm text-muted-foreground hover:bg-surface-elevated hover:text-foreground ${
              collapsed ? "justify-center px-2" : "px-3"
            }`}
          >
            <BookOpen className="relative z-10 h-4 w-4 shrink-0" />
            <span className={`relative z-10 ${collapsed ? "sr-only" : ""}`}>
              Help
            </span>
          </Link>
        </div>
      </nav>
    </aside>
  );
}
