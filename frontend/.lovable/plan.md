# DataSignalGTM Dashboard — Plan

Build a dark-mode GTM intelligence dashboard with a fixed sidebar, top bar, and Dashboard page. All data hardcoded.

## Files

- `src/styles.css` — force dark mode on `<html>`, set zinc-950 background, keep tokens but rely on Tailwind zinc/emerald/amber/red utilities for this build. Add a `pulse-emerald` keyframe for the health pill.
- `src/routes/__root.tsx` — wrap `<Outlet />` in a layout: 240px left sidebar + top bar + main content. Add `class="dark"` on `<html>`.
- `src/components/layout/Sidebar.tsx` — logo "DataSignalGTM" + nav (Dashboard / Signals / Accounts) using TanStack `Link` + `useRouterState` for active state.
- `src/components/layout/TopBar.tsx` — pulsing emerald "GTM Health Score: 82" pill + "Simulation Mode" toggle (local `useState`, amber when on).
- `src/routes/index.tsx` — Dashboard page (replace placeholder).
- `src/routes/signals.tsx` — minimal stub page ("Coming soon") so nav link resolves.
- `src/routes/accounts.tsx` — minimal stub page so nav link resolves.

## Dashboard sections (`src/routes/index.tsx`)

1. **Health Score card** — large `82` (text-7xl), sub-scores row "Data 87 · Signals 89 · Coverage 71".
2. **Metrics row** — 4 cards: Pipeline $127K, Time Saved 14h, Auto-Approved 8, Human Review 3.
3. **Live Signal Feed** — 3 signal cards:
   - Acme Corp — "3 VP hires + G2 spike" — Score 87 — HELD (amber pill) + amber banner "⚠ Data quality 71/100 — action blocked".
   - Hooli — "Salesforce → HubSpot migration" — Score 89 — APPROVED (emerald pill).
   - Globex Inc — "Series B $40M" — Score 86 — APPROVED (emerald pill).
4. **Hot Accounts** — top 3 with horizontal score bars (emerald fill on zinc-800 track) and "View" / "Engage" action buttons.

## Visual rules

- Background `bg-zinc-950`, cards `bg-zinc-900`, borders `border-zinc-800`.
- Accents: `emerald-400` good, `amber-400` warning, `red-400` critical.
- Sidebar: fixed `w-60`, border-right zinc-800, nav items with active state (emerald-400 text + zinc-800 bg).
- Top bar: sticky, h-14, border-bottom zinc-800.
- Health pill: `bg-emerald-400/10 text-emerald-400 ring-1 ring-emerald-400/30` with pulsing dot (`animate-pulse`).
- Simulation toggle: shadcn `Switch`; when on, label + ring turn amber-400.
- Enterprise feel: tight typography, subtle dividers, monospace numerics for scores (`font-mono tabular-nums`), no gradients/emoji except the warning glyph.

## Out of scope

No backend, no Lovable Cloud, no real API calls. Signals/Accounts pages are stubs.
