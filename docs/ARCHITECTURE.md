# DataSignalGTM — Architecture

## Overview

Next.js 15 App Router monolith with multi-tenant Supabase (RLS), TanStack Query v5, and a custom `ds-*` design system.

## Layer model (hybrid)

| Layer | Location | Responsibility |
|-------|----------|----------------|
| Routes | `app/` | Pages, layouts, API routes, Server Actions |
| Features | `features/signals`, `features/accounts` | Domain UI + queries + types (heavy domains only) |
| Shared UI | `components/ui/`, `components/layout/` | Design system, app chrome |
| Data reads | `lib/queries/` | TanStack `queryOptions`, browser Supabase |
| Mutations | `app/actions/` | Server Actions (signal transitions, data issues) |
| Domain rules | `types/` | Pure logic (e.g. signal state machine) |
| Hooks | `hooks/` | Client orchestration (`useInvalidateOrgGtm`, `useSignalMutations`) |
| Infra | `lib/supabase/`, `lib/inngest/`, `lib/ai/` | Clients, jobs, AI |

## Data flow

1. **Auth (server):** `app/(app)/layout.tsx` resolves org via `getAuthContext()` → `AuthProvider`.
2. **Reads (client):** TanStack Query + browser Supabase (RLS-scoped by `org_id`).
3. **Mutations (server):** Server Actions validate domain rules, then write via server Supabase client.
4. **Async / external:** API routes for Inngest playbooks, Stripe, webhooks.
5. **Realtime:** `useRealtimeSync` invalidates caches via `invalidateOrgGtm`.

## Query keys

Always use `orgQueryKeys(orgId)` from `lib/query-keys.ts`. Invalidate via `invalidateOrgGtm` / `useInvalidateOrgGtm`.

## API conventions

- **Demo reset:** single endpoint `POST /api/demo/reset`
  - Demo users: empty body
  - Admins: `{ "key": "<DEMO_RESET_KEY>" }`
- **Playbooks:** `POST /api/generate-playbook` (Inngest queue)
- **Billing:** `POST /api/billing/checkout`, `POST /api/billing/portal`

## Import boundaries

- `features/*` may import `lib/`, `hooks/`, `components/ui/`, `types/`
- `features/A` must not import `features/B` internals
- `components/ui/` must not import `features/`
- `app/actions/` must not import React components

## Feature modules (hybrid)

| Module | Public API | Notes |
|--------|------------|-------|
| `features/signals` | `SignalsTable`, queries, `useSignalMutations` | Signal review queue |
| `features/accounts` | `AccountsTable`, DQ queries | Account + data-issue surfaces |

Import from `@/features/<domain>` in route pages — not from sibling features.

## Server Actions

| Action file | Operations |
|-------------|------------|
| `app/actions/signals.ts` | `approveSignalAction`, `rejectSignalAction` |
| `app/actions/data-issues.ts` | `resolveGapAction`, `dismissGapAction`, `resolveAllGapsAction` |

Client hooks (`hooks/use-signal-mutations.ts`) call actions and invalidate caches.

## Verification

```bash
pnpm lint && pnpm typecheck && pnpm test:run && pnpm build
```
