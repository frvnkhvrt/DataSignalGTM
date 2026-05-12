import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const metadata = { title: "Getting Started — DataSignalGTM Docs" };

export default function GettingStartedPage() {
  return (
    <article className="space-y-8 text-zinc-300">
      <div>
        <h1 className="text-3xl font-bold text-zinc-100">Getting Started</h1>
        <p className="mt-3 text-zinc-400">
          DataSignalGTM is a GTM signal layer that ingests intent data, scores
          accounts against your ICP, and generates AI playbooks for your
          revenue team. This guide gets you from zero to pipeline in under 10
          minutes.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-zinc-100">
          1. Create an account
        </h2>
        <p>
          Visit{" "}
          <Link href="/login" className="text-emerald-400 hover:underline">
            datasignalgtm.com/login
          </Link>{" "}
          and sign in with your email (magic link) or Google account. On first
          login, DataSignalGTM automatically creates a workspace organisation
          for you and shows a quick onboarding tour.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-zinc-100">
          2. Explore the dashboard
        </h2>
        <p>
          After login you land on the{" "}
          <strong className="text-zinc-100">Dashboard</strong> at{" "}
          <code className="rounded bg-zinc-900 px-1.5 py-0.5 text-xs text-zinc-300">
            /dashboard
          </code>
          . You will see:
        </p>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          <li>
            <strong className="text-zinc-100">Metric cards</strong> — pending
            signals, average DQ score, approved signals, accounts.
          </li>
          <li>
            <strong className="text-zinc-100">DQ trend chart</strong> — running
            average data-quality score over time.
          </li>
          <li>
            <strong className="text-zinc-100">Velocity distribution</strong> —
            histogram of signal velocity scores.
          </li>
          <li>
            <strong className="text-zinc-100">ICP fit vs DQ scatter</strong> —
            spot high-fit, clean-data accounts at a glance.
          </li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-zinc-100">3. Add signals</h2>
        <p>
          You have three options:
        </p>
        <ol className="list-decimal space-y-2 pl-5 text-sm">
          <li>
            <strong className="text-zinc-100">Webhook (recommended):</strong>{" "}
            Push signals programmatically from your intent tools — see the{" "}
            <Link
              href="/help/webhook"
              className="text-emerald-400 hover:underline"
            >
              Webhook Integration guide
            </Link>
            .
          </li>
          <li>
            <strong className="text-zinc-100">Demo data reset:</strong> Admin
            users can restore canonical demo data from{" "}
            <code className="rounded bg-zinc-900 px-1.5 py-0.5 text-xs text-zinc-300">
              /admin
            </code>
            .
          </li>
          <li>
            <strong className="text-zinc-100">API:</strong> Use the REST API
            directly (same webhook schema, with Bearer auth).
          </li>
        </ol>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-zinc-100">
          4. Review & approve signals
        </h2>
        <p>
          Navigate to{" "}
          <Link href="/signals" className="text-emerald-400 hover:underline">
            /signals
          </Link>
          . Filter by status, sort by composite score, and click{" "}
          <strong className="text-zinc-100">Approve</strong> or{" "}
          <strong className="text-zinc-100">Reject</strong> on each row — or
          use bulk actions to process many at once.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-zinc-100">
          5. Generate an AI playbook
        </h2>
        <p>
          Click the <strong className="text-zinc-100">Generate playbook</strong>{" "}
          button on any signal. A background Inngest job queues immediately and
          the UI updates in real-time via Supabase Realtime when it completes.
          See{" "}
          <Link
            href="/help/signals"
            className="text-emerald-400 hover:underline"
          >
            Signals &amp; Playbooks
          </Link>{" "}
          for details.
        </p>
      </section>

      <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-4 text-sm text-emerald-200">
        <strong>Next step:</strong> Ready to connect your intent data? Head to
        the{" "}
        <Link href="/help/webhook" className="underline hover:text-emerald-300">
          Webhook Integration guide
        </Link>{" "}
        to start pushing signals from your tools.
        <Link
          href="/help/webhook"
          className="mt-3 flex items-center gap-1 text-xs font-medium text-emerald-400 hover:text-emerald-300"
        >
          Webhook guide <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </article>
  );
}
