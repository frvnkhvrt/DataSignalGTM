export const metadata = { title: "FAQ — DataSignalGTM Docs" };

const faqs = [
  {
    q: "What intent data sources does DataSignalGTM support?",
    a: "Any source that can make an HTTP POST request. Native connectors for 6sense, Clearbit Reveal, Bombora, and Apollo are on the roadmap. Today you can push from any tool via the webhook endpoint.",
  },
  {
    q: "How does the AI playbook generation work?",
    a: "When you click 'Generate playbook', an Inngest background job is queued immediately. The job loads signal and account context, calls the Gemini 2.0 Flash Lite model with a structured prompt, validates the JSON response with Zod, and persists the playbook to Supabase. The UI updates in real-time via Supabase Realtime.",
  },
  {
    q: "What is a 'Data Quality score'?",
    a: "DQ score (0–100) reflects how complete and fresh an account's data profile is. Missing fields (domain, employee count, industry), stale last-updated timestamps, and open data issues all reduce the score. The rules engine uses this score to auto-hold signals for underqualified accounts.",
  },
  {
    q: "Is my data isolated from other organisations?",
    a: "Yes. Every row in the database has an org_id foreign key. All queries use Supabase Row Level Security (RLS) policies that verify the requesting user belongs to the owning organisation. Other tenants cannot access your data.",
  },
  {
    q: "How do I set up Google OAuth?",
    a: "In the Supabase dashboard, go to Authentication → Providers → Google. Enable the provider and enter your Google Cloud OAuth client ID and secret. Then add your app's callback URL (https://your-project.supabase.co/auth/v1/callback) to the Google Cloud Console.",
  },
  {
    q: "Can I self-host DataSignalGTM?",
    a: "DataSignalGTM is designed for Vercel + Supabase. You can deploy it to any platform that supports Next.js 15 (Node.js runtime). Supabase can be self-hosted via their open-source stack. The Inngest dev server runs locally; for production you need a paid Inngest account.",
  },
  {
    q: "How do I reset demo data?",
    a: "Navigate to /admin (admin role required), enter your DEMO_RESET_KEY, and click 'Reset Demo Data'. This wipes all existing data and restores the canonical demo accounts, signals, and playbooks.",
  },
  {
    q: "What are feature flags and how do I use them?",
    a: "Feature flags let you toggle individual features (rules engine, advanced charts, bulk actions, command palette) without a code deploy. Set FEATURE_FLAGS='{\"enable_rules_engine\":false}' in your environment, or use individual overrides like FEATURE_ENABLE_RULES_ENGINE=false. Changes take effect on the next page load.",
  },
];

export default function FAQPage() {
  return (
    <article className="space-y-8">
      <div>
        <h1 className="ds-heading text-3xl font-semibold text-foreground">
          Frequently Asked Questions
        </h1>
        <p className="mt-3 text-muted-foreground">
          Common questions about DataSignalGTM. Can&apos;t find your answer?{" "}
          <a
            href="mailto:hello@datasignalgtm.com"
            className="text-primary hover:underline"
          >
            Email us
          </a>
          .
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-border/70 bg-background/25 shadow-[inset_0_1px_0_0_rgb(255_255_255/0.03)]">
        <div className="divide-y divide-border/80">
          {faqs.map(({ q, a }) => (
            <div key={q} className="px-4 py-5 transition-colors duration-[var(--ds-duration-tactile)] ease-[var(--ease-premium)] motion-reduce:transition-none sm:px-5 hover:bg-surface-elevated/25">
              <p className="text-sm font-semibold leading-snug text-foreground">{q}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{a}</p>
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}
