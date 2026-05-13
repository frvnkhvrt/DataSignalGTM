import Link from "next/link";
import { ArrowLeft, BookOpen, LifeBuoy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { HelpNav } from "@/components/help/help-nav";

export default function HelpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="ds-page min-h-screen text-foreground">
      <nav className="sticky top-0 z-40 border-b border-border/70 bg-background/88 backdrop-blur-xl ds-chrome-divider ds-inset-top-soft">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4 sm:px-6">
          <Link
            href="/"
            className="ds-focus-ring ds-transition-muted flex shrink-0 items-center gap-1.5 rounded-md px-1 py-0.5 text-xs text-muted-foreground hover:text-foreground motion-reduce:transition-none"
          >
            <ArrowLeft className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
            Back
          </Link>
          <div className="flex min-w-0 items-center gap-2 text-sm font-semibold text-foreground">
            <BookOpen className="h-4 w-4 shrink-0 text-primary" strokeWidth={2} />
            <span className="truncate">Documentation</span>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl min-w-0 px-4 pb-12 pt-6 sm:px-6 sm:pb-14 sm:pt-8">
        <div className="mb-6 lg:hidden">
          <HelpNav variant="rail" />
        </div>

        <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,17rem)_1fr] lg:items-start lg:gap-8 xl:gap-10">
          <aside className="hidden min-w-0 lg:block">
            <div className="sticky top-20 max-h-[calc(100vh-6rem)] space-y-4 overflow-x-hidden overflow-y-auto overscroll-y-contain pb-1 pr-1">
              <Card variant="translucent" className="p-4 shadow-soft ring-1 ring-border/30 ds-card-inner-glow">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/22 bg-primary/10 text-primary ds-inset-top-soft">
                  <LifeBuoy className="h-5 w-5" strokeWidth={2} />
                </div>
                <h2 className="ds-heading mt-3 text-base font-semibold text-foreground">
                  Help Center
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Practical guides for setup, signal review, and billing.
                </p>
              </Card>
              <HelpNav variant="sidebar" />
            </div>
          </aside>

          <main id="main-content" tabIndex={-1} className="min-w-0">
            <div className="rounded-2xl border border-border/70 bg-card/65 p-6 shadow-soft ring-1 ring-black/[0.04] backdrop-blur-xl dark:ring-white/[0.07] sm:p-8 ds-card-inner-glow">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
