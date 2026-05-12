export const metadata = { title: "Signals & Playbooks — DataSignalGTM Docs" };

export default function SignalsPage() {
  return (
    <article className="space-y-8 text-zinc-300">
      <div>
        <h1 className="text-3xl font-bold text-zinc-100">Signals &amp; Playbooks</h1>
        <p className="mt-3 text-zinc-400">
          Signals are the core unit in DataSignalGTM. Each signal represents an
          observable buying intent event for a specific account.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-zinc-100">Signal status lifecycle</h2>
        <div className="overflow-x-auto rounded-lg border border-zinc-800">
          <table className="w-full text-sm">
            <thead className="bg-zinc-900 text-left text-[11px] uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Meaning</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {[
                ["pending", "Newly ingested. Awaiting review."],
                ["approved", "Reviewed and actioned by a rep."],
                ["held", "Auto-held by the rules engine (low DQ score)."],
                ["rejected", "Marked as not relevant."],
              ].map(([status, desc]) => (
                <tr key={status}>
                  <td className="px-4 py-3 font-mono text-xs text-zinc-300">{status}</td>
                  <td className="px-4 py-3 text-zinc-400">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-zinc-100">Scoring dimensions</h2>
        <p className="text-sm">
          Each signal has four independent score dimensions (0–100) plus a
          composite score:
        </p>
        <ul className="list-disc space-y-2 pl-5 text-sm">
          <li><strong className="text-zinc-100">Velocity</strong> — How fast the account is accelerating in its buying journey.</li>
          <li><strong className="text-zinc-100">Fit</strong> — How well the account matches your ICP profile.</li>
          <li><strong className="text-zinc-100">Intent</strong> — Strength of explicit buying intent signals (page visits, content downloads, etc.).</li>
          <li><strong className="text-zinc-100">Timing</strong> — Likelihood the account is in an active buying cycle right now.</li>
          <li><strong className="text-zinc-100">Composite</strong> — Weighted average of the four dimensions. Used for default sort order.</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-zinc-100">AI Playbooks</h2>
        <p className="text-sm">
          Click <strong className="text-zinc-100">Generate playbook</strong> on any signal to queue an
          AI-powered outreach strategy. The job runs via Inngest in the background
          using Gemini 2.0 Flash. When complete, the playbook includes:
        </p>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          <li>Recommended outreach channel</li>
          <li>Personalised opening message</li>
          <li>Key talking points based on signal context</li>
          <li>Suggested follow-up cadence</li>
        </ul>
        <p className="text-sm">
          The playbook status progresses:{" "}
          <code className="rounded bg-zinc-900 px-1 py-0.5 text-xs">idle</code>
          {" → "}
          <code className="rounded bg-zinc-900 px-1 py-0.5 text-xs">queued</code>
          {" → "}
          <code className="rounded bg-zinc-900 px-1 py-0.5 text-xs">generating</code>
          {" → "}
          <code className="rounded bg-zinc-900 px-1 py-0.5 text-xs">completed</code>.
          Any failure lands in{" "}
          <code className="rounded bg-zinc-900 px-1 py-0.5 text-xs">failed</code>{" "}
          and Inngest retries up to 3 times.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-zinc-100">Rules engine</h2>
        <p className="text-sm">
          The rules engine runs automatically when you open the app. Accounts
          with a Data Quality score below the configured threshold (default: 60)
          have their pending signals automatically moved to{" "}
          <code className="rounded bg-zinc-900 px-1 py-0.5 text-xs">held</code>.
          This keeps your reps focused on accounts where outreach has a genuine
          chance of success.
        </p>
        <p className="text-sm">
          To disable the rules engine, set{" "}
          <code className="rounded bg-zinc-900 px-1 py-0.5 text-xs">FEATURE_ENABLE_RULES_ENGINE=false</code>{" "}
          in your environment.
        </p>
      </section>
    </article>
  );
}
