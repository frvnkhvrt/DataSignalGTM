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
import { motion, useReducedMotion } from "motion/react";
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
  const reducedMotion = useReducedMotion();
  const helpActive = pathname.startsWith("/help");
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("datasignalgtm.sidebar.collapsed") === "true";
  });

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--sidebar-width",
      collapsed ? "5.5rem" : "15rem"
    );
    window.localStorage.setItem(
      "datasignalgtm.sidebar.collapsed",
      String(collapsed)
    );
  }, [collapsed]);

  return (
    <aside
      className={cn(
        "fixed inset-x-0 bottom-0 z-20 flex h-16 border-t border-border bg-background/88 backdrop-blur-xl sm:inset-x-auto sm:inset-y-0 sm:left-0 sm:h-auto sm:w-[var(--sidebar-width)] sm:flex-col sm:border-r-0 sm:border-t-0 sm:[box-shadow:1px_0_0_var(--color-border)]",
        "transition-[width,background-color,box-shadow] duration-[var(--ds-duration-smooth)] ease-[var(--ease-premium)]",
        collapsed && "sm:bg-background/92 sm:[box-shadow:1px_0_0_var(--color-border),inset_0_1px_0_0_rgb(255_255_255/0.02)]"
      )}
    >
      <div
        className={cn(
          "hidden sm:flex ds-chrome-divider",
          collapsed
            ? "flex-col items-center gap-2 px-2.5 pb-2.5 pt-2.5"
            : "h-14 flex-row items-center gap-3 px-4"
        )}
      >
        <div
          className={cn(
            "flex shrink-0 items-center justify-center border border-primary/22 bg-primary/10 ds-shadow-brand-well ds-inset-top-soft transition-[border-color,box-shadow,transform] duration-[var(--ds-duration-tactile)] ease-[var(--ease-premium)] hover:border-primary/32 hover:bg-primary/11",
            "size-8 rounded-lg"
          )}
        >
          <Activity className="size-4 text-primary" strokeWidth={2.25} />
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
            "hidden shrink-0 text-muted-foreground transition-[background-color,color,transform,box-shadow,border-color] duration-[var(--ds-duration-tactile)] ease-[var(--ease-premium)] motion-reduce:transition-none sm:inline-flex",
            "ds-focus-ring border border-transparent hover:border-border/55 hover:bg-surface-elevated hover:text-foreground hover:shadow-[inset_0_1px_0_0_rgb(255_255_255/0.04)] active:scale-[0.97] motion-reduce:active:scale-100",
            collapsed ? "size-8 rounded-lg" : "ml-auto size-8 rounded-lg"
          )}
          onClick={() => setCollapsed((v) => !v)}
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="size-4" strokeWidth={2.25} />
          ) : (
            <ChevronLeft className="size-4" strokeWidth={2.25} />
          )}
        </Button>
      </div>

      <nav
        className={cn(
          "grid flex-1 grid-cols-3 gap-1 px-2 py-2 sm:block sm:px-3 sm:py-4",
          collapsed ? "sm:space-y-4" : "sm:space-y-5"
        )}
      >
        {navGroups.map((group) => (
          <div key={group.label} className="contents sm:block">
            <div
              className={cn(
                "hidden px-2 pb-1.5 pt-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/60 sm:block",
                collapsed && "sr-only"
              )}
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
                    className={cn(
                      "ds-focus-ring relative flex flex-col items-center justify-center gap-1 overflow-hidden rounded-md border-t-2 px-2 py-2 text-[11px] transition-[color,background-color,border-color,box-shadow] duration-[var(--ds-duration-tactile)] ease-[var(--ease-premium)] motion-reduce:transition-none sm:flex-row sm:border-l-2 sm:border-t-0 sm:text-sm",
                      collapsed
                        ? "sm:mx-auto sm:size-10 sm:max-w-10 sm:justify-center sm:gap-0 sm:rounded-lg sm:border-l-transparent sm:px-0 sm:py-0"
                        : "sm:justify-start sm:gap-3 sm:px-3 sm:py-2",
                      active
                        ? "border-primary text-foreground sm:border-transparent sm:font-medium"
                        : "border-transparent text-muted-foreground hover:bg-surface-elevated hover:text-foreground sm:hover:shadow-[inset_0_1px_0_0_rgb(255_255_255/0.04)]"
                    )}
                  >
                    {/* Desktop animated pill — slides between active items via layoutId */}
                    {active && (
                      <motion.span
                        layoutId={PILL_LAYOUT_ID}
                        aria-hidden="true"
                        className={cn(
                          "ds-nav-active-pill pointer-events-none absolute hidden border-l-2 border-primary bg-gradient-to-r from-primary/14 to-primary/6 sm:block",
                          collapsed
                            ? "inset-1 rounded-md"
                            : "inset-0 rounded-md"
                        )}
                        transition={
                          reducedMotion ? { duration: 0.01 } : spring.sidebarPill
                        }
                      />
                    )}
                    <Icon className="relative z-10 size-4 shrink-0" strokeWidth={2} />
                    <span className={cn("relative z-10", collapsed && "sm:sr-only")}>
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
            aria-current={helpActive ? "page" : undefined}
            title={collapsed ? "Help" : undefined}
            onFocus={() => router.prefetch("/help")}
            onMouseEnter={() => router.prefetch("/help")}
            className={cn(
              "ds-focus-ring relative flex items-center gap-3 overflow-hidden rounded-md border-l-2 border-transparent py-2 text-sm text-muted-foreground transition-[color,background-color,box-shadow] duration-[var(--ds-duration-tactile)] ease-[var(--ease-premium)] motion-reduce:transition-none hover:bg-surface-elevated hover:text-foreground sm:hover:shadow-[inset_0_1px_0_0_rgb(255_255_255/0.04)]",
              helpActive && "text-foreground sm:font-medium",
              collapsed
                ? "justify-center px-2 sm:mx-auto sm:size-10 sm:max-w-10 sm:rounded-lg sm:px-0"
                : "px-3"
            )}
          >
            <BookOpen className="relative z-10 size-4 shrink-0" strokeWidth={2} />
            <span className={cn("relative z-10", collapsed && "sm:sr-only")}>
              Help
            </span>
          </Link>
        </div>
      </nav>
    </aside>
  );
}
