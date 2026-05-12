import { NextRequest, NextResponse } from "next/server";
import { getOptionalServerEnv } from "@/lib/env";
import { createAdminClient, getAuthContext } from "@/lib/supabase/server";

const DEMO_ACCOUNTS = [
  { name: "Stripe", domain: "stripe.com", industry: "Payments", employee_count: 8000, data_quality_score: 96, icp_fit_score: 95 },
  { name: "Figma", domain: "figma.com", industry: "Design", employee_count: 1500, data_quality_score: 95, icp_fit_score: 94 },
  { name: "Notion", domain: "notion.so", industry: "Productivity", employee_count: 700, data_quality_score: 94, icp_fit_score: 92 },
  { name: "Vercel", domain: "vercel.com", industry: "DevTools", employee_count: 600, data_quality_score: 93, icp_fit_score: 91 },
  { name: "Linear", domain: "linear.app", industry: "Productivity", employee_count: 200, data_quality_score: 92, icp_fit_score: 93 },
  { name: "HubSpot", domain: "hubspot.com", industry: "CRM", employee_count: 8500, data_quality_score: 91, icp_fit_score: 88 },
  { name: "Intercom", domain: "intercom.com", industry: "Customer Support", employee_count: 1100, data_quality_score: 90, icp_fit_score: 87 },
  { name: "Amplitude", domain: "amplitude.com", industry: "Analytics", employee_count: 800, data_quality_score: 89, icp_fit_score: 86 },
  { name: "Mixpanel", domain: "mixpanel.com", industry: "Analytics", employee_count: 400, data_quality_score: 88, icp_fit_score: 84 },
  { name: "Airtable", domain: "airtable.com", industry: "Productivity", employee_count: 900, data_quality_score: 87, icp_fit_score: 85 },
  { name: "Retool", domain: "retool.com", industry: "DevTools", employee_count: 500, data_quality_score: 86, icp_fit_score: 83 },
  { name: "Loom", domain: "loom.com", industry: "Video", employee_count: 350, data_quality_score: 85, icp_fit_score: 81 },
  { name: "Lattice", domain: "lattice.com", industry: "HR Tech", employee_count: 600, data_quality_score: 84, icp_fit_score: 80 },
  { name: "Contentful", domain: "contentful.com", industry: "CMS", employee_count: 750, data_quality_score: 83, icp_fit_score: 78 },
  { name: "Brex", domain: "brex.com", industry: "Fintech", employee_count: 1200, data_quality_score: 82, icp_fit_score: 82 },
  { name: "Carta", domain: "carta.com", industry: "Fintech", employee_count: 1800, data_quality_score: 81, icp_fit_score: 79 },
  { name: "Deel", domain: "deel.com", industry: "HR Tech", employee_count: 3500, data_quality_score: 79, icp_fit_score: 86 },
  { name: "Rippling", domain: "rippling.com", industry: "HR Tech", employee_count: 3000, data_quality_score: 78, icp_fit_score: 85 },
  { name: "Make", domain: "make.com", industry: "Automation", employee_count: 400, data_quality_score: 76, icp_fit_score: 77 },
  { name: "ElevenLabs", domain: "elevenlabs.io", industry: "AI/Voice", employee_count: 150, data_quality_score: 73, icp_fit_score: 90 },
  { name: "Cursor", domain: "cursor.com", industry: "AI/DevTools", employee_count: 80, data_quality_score: 71, icp_fit_score: 92 },
  { name: "Lovable", domain: "lovable.dev", industry: "AI/DevTools", employee_count: 100, data_quality_score: 68, icp_fit_score: 94 },
];

const DEMO_SIGNALS = [
  { account_name: "Stripe", source: "New CFO + earnings beat", status: "approved", velocity_score: 94, why_now: "Finance leadership change", assigned_to: "A. Romero" },
  { account_name: "Figma", source: "Config 2026 announcement", status: "approved", velocity_score: 91, why_now: "Major product event window", assigned_to: "J. Chen" },
  { account_name: "Linear", source: "Series C $80M raised", status: "approved", velocity_score: 93, why_now: "Funding round closed", assigned_to: "M. Patel" },
  { account_name: "Vercel", source: "Next.js 16 release + hiring surge", status: "approved", velocity_score: 90, why_now: "Launch + RevOps hiring", assigned_to: "J. Chen" },
  { account_name: "Cursor", source: "5 AE hires + ARR milestone", status: "held", velocity_score: 92, why_now: "Aggressive GTM ramp", assigned_to: "AE Pool" },
  { account_name: "Lovable", source: "Stack migration off Vercel", status: "held", velocity_score: 89, why_now: "Infrastructure shift detected", assigned_to: "AE Pool" },
  { account_name: "ElevenLabs", source: "Enterprise tier launch", status: "held", velocity_score: 88, why_now: "New ICP segment, low data trust", assigned_to: null },
  { account_name: "Deel", source: "Layoff signal + churn risk", status: "held", velocity_score: 65, why_now: "Negative signals exceed threshold", assigned_to: null },
];

const PLAYBOOKS: Record<string, object> = {
  Stripe: {
    role_target: "VP of Revenue Operations",
    rationale: "Finance leadership change + earnings beat creates a rare expansion window. Composite score >90 with verified data trust.",
    channels: ["LinkedIn", "Email", "Phone"],
    steps: [
      { day: 1, channel: "LinkedIn", action: "Connect with new CFO", message_hint: "Reference Q4 beat + RevOps modernization" },
      { day: 2, channel: "Email", action: "Send tailored intro", message_hint: "Lead with peer benchmark in Payments vertical" },
      { day: 4, channel: "Phone", action: "Discovery call", message_hint: "Anchor on RevOps tech stack consolidation" },
      { day: 7, channel: "Email", action: "Follow-up + case study", message_hint: "Share Stripe-comparable customer story" },
    ],
  },
  Figma: {
    role_target: "Director of Revenue",
    rationale: "Config 2026 announcement signals expansion intent. Strong ICP fit + high data trust.",
    channels: ["LinkedIn", "Email"],
    steps: [
      { day: 1, channel: "LinkedIn", action: "Engage on Config post", message_hint: "Comment with relevant insight" },
      { day: 2, channel: "Email", action: "Event-tied intro", message_hint: "Tie message to Config keynote themes" },
      { day: 5, channel: "LinkedIn", action: "Direct message", message_hint: "Offer 15-min Config debrief" },
      { day: 8, channel: "Email", action: "Value follow-up", message_hint: "Share design-ops benchmark report" },
    ],
  },
  Linear: {
    role_target: "VP of Sales",
    rationale: "Series C closed last week. Hiring and tooling budget unlocked — classic expansion trigger.",
    channels: ["Email", "LinkedIn", "Phone"],
    steps: [
      { day: 1, channel: "Email", action: "Congrats + value frame", message_hint: "Reference $80M raise; tie to scaling pain" },
      { day: 3, channel: "LinkedIn", action: "Add VP of Sales", message_hint: "Share post-Series-C playbook" },
      { day: 5, channel: "Phone", action: "Discovery call", message_hint: "Focus on team scaling and pipeline ops" },
      { day: 9, channel: "Email", action: "Bring in exec sponsor", message_hint: "Loop in CRO for peer-level outreach" },
    ],
  },
  Vercel: {
    role_target: "Head of Developer Relations",
    rationale: "Next.js 16 launch + RevOps hiring surge. Buying committee actively forming.",
    channels: ["LinkedIn", "Email"],
    steps: [
      { day: 1, channel: "LinkedIn", action: "Engage on launch post", message_hint: "Highlight a specific Next.js 16 capability" },
      { day: 2, channel: "Email", action: "Tailored intro", message_hint: "Anchor on DevRel + RevOps overlap" },
      { day: 4, channel: "Email", action: "Send case study", message_hint: "Share metrics from a comparable platform" },
      { day: 7, channel: "LinkedIn", action: "Voice memo", message_hint: "30-second personalized video note" },
    ],
  },
};

const DATA_ISSUES = [
  { account: "Lovable", field_name: "domain", issue_type: "stale", severity: "high", suggested_fix: "Verify lovable.dev is current primary domain" },
  { account: "Lovable", field_name: "employee_count", issue_type: "stale", severity: "high", suggested_fix: "Company growing fast — re-enrich headcount" },
  { account: "Cursor", field_name: "employee_count", issue_type: "stale", severity: "high", suggested_fix: "Likely >200 now — re-enrich from LinkedIn" },
  { account: "Cursor", field_name: "industry", issue_type: "invalid", severity: "medium", suggested_fix: "Classify as AI/DevTools or Developer Tools" },
  { account: "ElevenLabs", field_name: "industry", issue_type: "invalid", severity: "medium", suggested_fix: "Classify as AI/Voice or AI/ML — affects ICP scoring" },
  { account: "ElevenLabs", field_name: "employee_count", issue_type: "stale", severity: "medium", suggested_fix: "Series B hiring surge — verify headcount" },
  { account: "Make", field_name: "domain", issue_type: "missing", severity: "high", suggested_fix: "Add primary domain make.com" },
  { account: "Deel", field_name: "industry", issue_type: "invalid", severity: "low", suggested_fix: "HR Tech vs Fintech — verify primary vertical" },
  { account: "Rippling", field_name: "domain", issue_type: "stale", severity: "medium", suggested_fix: "Verify rippling.com is still primary" },
  { account: "Carta", field_name: "employee_count", issue_type: "stale", severity: "medium", suggested_fix: "Post-layoff headcount needs verification" },
  { account: "Brex", field_name: "industry", issue_type: "invalid", severity: "low", suggested_fix: "Fintech vs Banking — clarify for ICP model" },
  { account: "Contentful", field_name: "employee_count", issue_type: "stale", severity: "medium", suggested_fix: "Headcount data >6 months old" },
  { account: "Lattice", field_name: "domain", issue_type: "stale", severity: "low", suggested_fix: "Verify lattice.com is current" },
  { account: "Amplitude", field_name: "employee_count", issue_type: "stale", severity: "medium", suggested_fix: "Post-restructuring headcount unclear" },
  { account: "Mixpanel", field_name: "industry", issue_type: "invalid", severity: "low", suggested_fix: "Analytics vs Product Analytics — affects scoring" },
];

export async function POST(request: NextRequest) {
  const auth = await getAuthContext();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (auth.org.role !== "admin") {
    return NextResponse.json(
      { error: "Only organization admins can reset demo data." },
      { status: 403 }
    );
  }

  const demoResetKey = getOptionalServerEnv("DEMO_RESET_KEY");

  if (!demoResetKey) {
    return NextResponse.json(
      { error: "Demo reset is not configured. Set DEMO_RESET_KEY on the server." },
      { status: 503 }
    );
  }

  let body: { key?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  if (body.key !== demoResetKey) {
    return NextResponse.json({ error: "Invalid reset key." }, { status: 403 });
  }

  const db = createAdminClient();

  try {
    // Clear tables in FK-safe order
    const { data: existingSignals } = await db
      .from("signals")
      .select("id")
      .eq("org_id", auth.org.id);
    const signalIds = (existingSignals ?? []).map((signal) => signal.id);
    if (signalIds.length > 0) {
      await db.from("channel_actions").delete().in("signal_id", signalIds);
    }
    await db.from("audit_trail").delete().eq("org_id", auth.org.id);
    await db.from("data_issues").delete().eq("org_id", auth.org.id);
    await db.from("signals").delete().eq("org_id", auth.org.id);
    await db.from("accounts").delete().eq("org_id", auth.org.id);

    // Reseed accounts
    const { error: accErr } = await db
      .from("accounts")
      .insert(DEMO_ACCOUNTS.map((account) => ({ ...account, org_id: auth.org.id })));
    if (accErr) throw new Error(`accounts: ${accErr.message}`);

    // Reseed signals
    const { error: sigErr } = await db
      .from("signals")
      .insert(DEMO_SIGNALS.map((signal) => ({ ...signal, org_id: auth.org.id })));
    if (sigErr) throw new Error(`signals: ${sigErr.message}`);

    // Attach playbooks to approved signals
    for (const [name, pb] of Object.entries(PLAYBOOKS)) {
      const { error } = await db
        .from("signals")
        .update({ playbook: pb as never })
        .eq("org_id", auth.org.id)
        .eq("account_name", name);
      if (error) throw new Error(`playbook ${name}: ${error.message}`);
    }

    // Reseed data issues
    const { data: accs } = await db
      .from("accounts")
      .select("id,name")
      .eq("org_id", auth.org.id);
    const accMap = new Map((accs ?? []).map((a) => [a.name, a.id]));

    const issueRows = DATA_ISSUES.filter((i) => accMap.has(i.account)).map(
      (i) => ({
        account_id: accMap.get(i.account)!,
        org_id: auth.org.id,
        field_name: i.field_name,
        issue_type: i.issue_type,
        severity: i.severity,
        suggested_fix: i.suggested_fix,
        status: "open",
      })
    );

    if (issueRows.length > 0) {
      const { error: diErr } = await db.from("data_issues").insert(issueRows);
      if (diErr) throw new Error(`data_issues: ${diErr.message}`);
    }

    return NextResponse.json({
      success: true,
      message: "Demo data reset to canonical state.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[demo-reset]", message);
    return NextResponse.json(
      { error: "Reset failed.", detail: message },
      { status: 500 }
    );
  }
}
