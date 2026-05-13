export const metadata = { title: "Signals & Playbooks — DataSignalGTM Docs" };

export default function SignalsPage() {
  return (
    <article className="space-y-8">
      <div>
        <h1 className="ds-heading text-3xl font-semibold text-foreground">
          Signals &amp; Playbooks
        </h1>
        <p className="mt-3 text-muted-foreground">
          Signals are the core unit in DataSignalGTM. Each signal represents an
          observable buying intent event for a specific account.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="ds-heading text-xl font-semibold text-foreground">
          Signal status lifecycle
        </h2>
        <div className="overflow-x-auto overscroll-x-contain rounded-lg border border-border/80 bg-background/30 shadow-[inset_0_1px_0_0_rgb(255_255_255/0.03)]">
          <table className="w-full min-w-0 text-sm">
            <thead className="border-b border-border/80 bg-muted/40 text-left backdrop-blur-sm">
              <tr>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  Meaning
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[
                ["pending", "Newly ingested. Awaiting review."],
                ["approved", "Reviewed and actioned by a rep."],
                ["held", "Auto-held by the rules engine (low DQ score)."],
                ["rejected", "Marked as not relevant."],
              ].map(([status, desc]) => (
                <tr key={status}>
                  <td className="px-4 py-3 font-mono text-xs text-foreground">
                    {status}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {desc}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="ds-heading text-xl font-semibold text-foreground">
          Scoring dimensions
        </h2>
        <p className="text-sm text-muted-foreground">
          Each signal has four independent score dimensions (0–100) plus a
          composite score:
        </p>
        <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
          <li>
            <strong className="text-foreground">Velocity</strong> — How fast
            the account is accelerating in its buying journey.
          </li>
          <li>
            <strong className="text-foreground">Fit</strong> — How well the
            account matches your ICP profile.
          </li>
          <li>
            <strong className="text-foreground">Intent</strong> — Strength of
            explicit buying intent signals (page visits, content downloads,
            etc.).
          </li>
          <li>
            <strong className="text-foreground">Timing</strong> — Likelihood
            the account is in an active buying cycle right now.
          </li>
          <li>
            <strong className="text-foreground">Composite</strong> — Weighted
            average of the four dimensions. Used for default sort order.
          </li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="ds-heading text-xl font-semibold text-foreground">
          AI Playbooks
        </h2>
        <p className="text-sm text-muted-foreground">
          Click <strong className="text-foreground">Generate playbook</strong>{" "}
          on any signal to queue an AI-powered outreach strategy. The job runs
          via Inngest in the background using Gemini 2.0 Flash. When complete,
          the playbook includes:
        </p>
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li>Recommended outreach channel</li>
          <li>Personalised opening message</li>
          <li>Key talking points based on signal context</li>
          <li>Suggested follow-up cadence</li>
        </ul>
        <p className="text-sm text-muted-foreground">
          The playbook status progresses:{" "}
          <code className="rounded border border-border bg-background/60 px-1 py-0.5 text-xs text-foreground">
            idle
          </code>
          {" → "}
          <code className="rounded border border-border bg-background/60 px-1 py-0.5 text-xs text-foreground">
            queued
          </code>
          {" → "}
          <code className="rounded border border-border bg-background/60 px-1 py-0.5 text-xs text-foreground">
            generating
          </code>
          {" → "}
          <code className="rounded border border-border bg-background/60 px-1 py-0.5 text-xs text-foreground">
            completed
          </code>
          . Any failure lands in{" "}
          <code className="rounded border border-border bg-background/60 px-1 py-0.5 text-xs text-foreground">
            failed
          </code>{" "}
          and Inngest retries up to 3 times.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="ds-heading text-xl font-semibold text-foreground">
          Rules engine
        </h2>
        <p className="text-sm text-muted-foreground">
          The rules engine runs automatically when you open the app. Accounts
          with a Data Quality score below the configured threshold (default: 60)
          have their pending signals automatically moved to{" "}
          <code className="rounded border border-border bg-background/60 px-1 py-0.5 text-xs text-foreground">
            held
          </code>
          . This keeps your reps focused on accounts where outreach has a
          genuine chance of success.
        </p>
        <p className="text-sm text-muted-foreground">
          To disable the rules engine, set{" "}
          <code className="rounded border border-border bg-background/60 px-1 py-0.5 text-xs text-foreground">
            FEATURE_ENABLE_RULES_ENGINE=false
          </code>{" "}
          in your environment.
        </p>
      </section>
    </article>
  );
}
