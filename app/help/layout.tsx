import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";

const sections = [
  { href: "/help", label: "Getting Started" },
  { href: "/help/signals", label: "Signals & Playbooks" },
  { href: "/help/webhook", label: "Webhook Integration" },
  { href: "/help/pricing", label: "Pricing & Limits" },
  { href: "/help/faq", label: "FAQ" },
];

export default function HelpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <nav className="sticky top-0 z-40 border-b border-zinc-800/60 bg-zinc-950/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </Link>
          <div className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
            <BookOpen className="h-4 w-4 text-emerald-400" />
            Documentation
          </div>
        </div>
      </nav>

      <div className="mx-auto flex max-w-6xl gap-8 px-4 py-10 sm:px-6">
        {/* Sidebar nav */}
        <aside className="hidden w-52 shrink-0 lg:block">
          <nav className="sticky top-24 space-y-0.5">
            {sections.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="block rounded-md px-3 py-2 text-sm text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
              >
                {label}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <main className="min-w-0 flex-1 prose prose-invert prose-zinc max-w-none">
          {children}
        </main>
      </div>
    </div>
  );
}
