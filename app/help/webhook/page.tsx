export const metadata = { title: "Webhook Integration — DataSignalGTM Docs" };

function CodeBlock({ children, lang = "json" }: { children: string; lang?: string }) {
  void lang;
  return (
    <pre className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-900 p-4 text-xs leading-relaxed text-zinc-300">
      <code>{children.trim()}</code>
    </pre>
  );
}

export default function WebhookPage() {
  return (
    <article className="space-y-8 text-zinc-300">
      <div>
        <h1 className="text-3xl font-bold text-zinc-100">Webhook Integration</h1>
        <p className="mt-3 text-zinc-400">
          Push signals from any external source directly into DataSignalGTM via
          a single authenticated HTTP endpoint.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-zinc-100">Endpoint</h2>
        <CodeBlock lang="http">{`POST https://your-app.vercel.app/api/webhooks/signals`}</CodeBlock>
        <p className="text-sm">
          Accepts a single signal object or an array of up to 100 signals. All
          signals are <strong className="text-zinc-100">upserted</strong> — if an
          account already exists it is updated, otherwise created.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-zinc-100">Authentication</h2>
        <p className="text-sm">
          Set <code className="rounded bg-zinc-900 px-1 py-0.5 text-xs text-zinc-300">SIGNAL_WEBHOOK_SECRET</code> in
          your environment. Pass it in one of three ways:
        </p>
        <CodeBlock lang="http">{`
# Option 1: Authorization header (recommended)
Authorization: Bearer <SIGNAL_WEBHOOK_SECRET>

# Option 2: Custom header
X-Webhook-Secret: <SIGNAL_WEBHOOK_SECRET>

# Option 3: Query parameter (less secure)
POST /api/webhooks/signals?secret=<SIGNAL_WEBHOOK_SECRET>
        `}</CodeBlock>
        <p className="text-sm text-amber-300">
          ⚠ If <code className="rounded bg-zinc-900 px-1 py-0.5 text-xs">SIGNAL_WEBHOOK_SECRET</code> is not set, the
          endpoint is open to all callers. Always set it in production.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-zinc-100">
          Request schema (single signal)
        </h2>
        <CodeBlock>{`{
  "org_id":        "uuid-of-your-organisation",   // required
  "account_name":  "Acme Corp",                   // required
  "source":        "6sense",                       // optional — default "webhook"
  "why_now":       "High intent spike on pricing page",
  "velocity_score":  85,  // 0–100
  "fit_score":       90,  // 0–100
  "intent_score":    78,  // 0–100
  "timing_score":    82,  // 0–100
  "composite_score": 84,  // 0–100, auto-calculated if omitted
  "external_id":   "6s-acme-20260510"  // optional — deduplication key
}`}</CodeBlock>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-zinc-100">Batch example</h2>
        <CodeBlock>{`[
  { "org_id": "...", "account_name": "Acme Corp",  "source": "6sense",  "velocity_score": 85 },
  { "org_id": "...", "account_name": "BuildCo",    "source": "Bombora", "intent_score": 72 },
  { "org_id": "...", "account_name": "Cloudware",  "source": "Apollo",  "fit_score": 91 }
]`}</CodeBlock>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-zinc-100">Response</h2>
        <CodeBlock>{`{
  "received": 3,
  "created":  2,
  "updated":  1,
  "errors":   0,
  "results": [
    { "index": 0, "id": "uuid", "created": true },
    { "index": 1, "id": "uuid", "created": true },
    { "index": 2, "id": "uuid", "created": false }
  ]
}`}</CodeBlock>
        <p className="text-sm">
          Returns HTTP <strong className="text-zinc-100">200</strong> on full
          success, <strong className="text-zinc-100">207</strong> on partial
          success, and <strong className="text-zinc-100">422</strong> if all
          signals failed validation.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-zinc-100">cURL example</h2>
        <CodeBlock lang="bash">{`curl -X POST https://your-app.vercel.app/api/webhooks/signals \\
  -H "Authorization: Bearer $SIGNAL_WEBHOOK_SECRET" \\
  -H "Content-Type: application/json" \\
  -d '{
    "org_id": "YOUR_ORG_UUID",
    "account_name": "Acme Corp",
    "source": "6sense",
    "why_now": "Spike on pricing page",
    "velocity_score": 85
  }'`}</CodeBlock>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-zinc-100">Finding your org_id</h2>
        <p className="text-sm">
          Your organisation UUID is shown in the top-right of the app. You can
          also find it in <strong className="text-zinc-100">Settings → Billing</strong> or
          by querying the Supabase dashboard.
        </p>
      </section>
    </article>
  );
}
