# CLAUDE.md — guidance for AI assistants

This file is loaded by Claude Code (and similar tools) on every session.
It captures non-obvious conventions and constraints that aren't visible
from the code alone.

## What this project is

A Next.js 16 **static export** (`output: 'export'`) storefront. Pre-renders
to `out/` at build time, served from a CDN. No backend, no API routes, no
middleware, no server actions *in this repo*. Everything is client-side after
hydration.

The app is **not** state-less, though. After hydration it talks to three
hosted services directly from the browser:

- **Neon Auth** (Better Auth, via `@neondatabase/neon-js`) for sign-in,
  sign-up, password reset, and Google OAuth.
- **Neon Data API** (PostgREST-style REST) for persisting and reading
  orders. The Data API URL is **public** (baked into the bundle); the only
  thing protecting order data is **Postgres Row-Level Security**. See the
  security model below.
- **Web3Forms** for the checkout order email, and **Frankfurter** for FX
  rates.

### Security model (read before touching auth, checkout, or order data)

- The browser hits the Data API with the user's Neon Auth JWT. Queries like
  `listMyOrders()` (`src/lib/orderPersistence.ts`) deliberately have **no
  `user_id` filter** — RLS does the scoping. The SQL that makes this safe
  lives in `scripts/db/` (`002_ecommerce_orders.sql` policies +
  `003_security_hardening.sql` FORCE-RLS/anon-revoke). **Never** add a query
  that assumes the client can be trusted to filter its own rows.
- After any change to the data model or policies, run
  `scripts/db/004_verify_security.sql` (read-only) against the live Neon DB,
  then do the two-user read test (log in as B, try to read A's order).
- Checkout order email and password-reset are gated by **hCaptcha**
  (`src/lib/hcaptcha.ts`, `src/components/HCaptcha.tsx`). The Web3Forms
  access key is public, so the captcha — enforced server-side by Web3Forms /
  Neon Auth — is the real anti-abuse control, not the honeypot.

## Hard rules

1. **Static export only.** Do not propose `getServerSideProps`,
   `route.ts` handlers, `middleware.ts`, server actions, or anything else
   that requires a Node runtime. If a feature can't be expressed as static
   HTML + client JS, surface the constraint and discuss instead of writing
   it.

2. **Pnpm is the package manager.** `package.json` pins
   `packageManager: pnpm@10.33.0`. Never run `npm install` or `yarn` here
   — they generate a competing lockfile that breaks Vercel's
   `--frozen-lockfile` install. If you must add a dep, use
   `pnpm add <name>` and commit `pnpm-lock.yaml`.

3. **Pure logic goes in `src/lib/` with a colocated `*.test.ts`.** Vitest
   runs in `environment: 'node'` (no JSDOM) — anything DOM-coupled needs
   either a Playwright check or a thin pure helper underneath.

4. **`public/css/main.css` and `public/css/vendors.css` are scraped from
   the original site.** Treat them as read-only. Add styles to
   `src/app/globals.css` using the `.ngc-` namespace.

5. **Don't commit `.env.local`.** It holds the Web3Forms key, the hCaptcha
   site key, and the Neon Auth/Data API URLs. These are all `NEXT_PUBLIC_`
   (inlined into the bundle) and individually low-sensitivity, but keep the
   file out of git history anyway. There are **no server secrets in this
   repo** — every secret (Web3Forms secret, hCaptcha secret, Postgres
   credentials) lives in a hosted dashboard. If you ever need a true secret,
   it cannot be `NEXT_PUBLIC_` and cannot live in a static export; raise it.

6. **Branch per feature → PR → merge to master.** CI must be green
   (`.github/workflows/ci.yml`). The trailer
   `Co-Authored-By: Claude Opus <noreply@anthropic.com>` goes on every
   commit you author.

## Soft rules / conventions

- **`.ngc-` design system** is the modern CSS layer in `globals.css`.
  Components written today should use `.ngc-*` classes; the legacy
  Bootstrap layer (`vendors.css`) will eventually be removed.
- **Component file size.** Most components are <200 lines. If a component
  grows past that, extract a hook or split sub-components.
- **No `dangerouslySetInnerHTML`** — with exactly one sanctioned exception:
  `src/components/JsonLd.tsx`, which emits `<script
  type="application/ld+json">` (never executed as script) and defangs `</`.
  Its input must stay limited to our own static catalog data — never user,
  session, or remote content. Do not add any other usage.
- **JSX-A11Y** is strict. `aria-pressed` and `aria-expanded` need
  string literals (`'true'` / `'false'`), not raw booleans. The linter
  has flagged this several times.
- **Money is formatted with `$${n.toFixed(2)}`** in code paths that emit
  to email or external services; in UI we use the `money()` helper
  (Intl.NumberFormat USD, no decimals).
- **Cart items** are the structured `CartItem` shape (`productName`,
  `packCount`, `packLabel?`, `slug`, `price`, `qty`, `image?`,
  `brand?`). The legacy `{ name, price, qty }` shape is migrated by
  `migrateItem` in `CartContext.tsx`.

## Where things live

| Concern | File |
|---|---|
| Cart math | `src/lib/cart.ts` |
| Pack pricing | `src/lib/pricing.ts` |
| Checkout validation | `src/lib/checkout.ts` (`checkoutFieldValidators`) |
| Order email body | `src/lib/orderEmail.ts` |
| Order submit pipeline | `src/lib/checkoutOrder.ts` → `orderSubmission.ts` (Web3Forms) + `orderPersistence.ts` (Neon) |
| Auth client / session | `src/lib/neon-client.ts`, `src/lib/authSession.ts`, `src/components/AuthForm.tsx` |
| Open-redirect guard | `src/lib/authRedirect.ts` (`safeAuthRedirect`) |
| Postgres schema + RLS | `scripts/db/*.sql` (002 = policies, 003 = hardening, 004 = read-only verify) |
| Captcha (anti-abuse) | `src/lib/hcaptcha.ts`, `src/components/HCaptcha.tsx` |
| Catalog filter/sort | `src/lib/productTable.helper.ts` |
| Cart context | `src/context/CartContext.tsx` |
| Sitewide CSS | `src/app/globals.css` (~1.6k lines, `.ngc-` namespace) |
| Header height sync | `src/components/NavInteractions.tsx` (ResizeObserver → `--header-h`) |
| E2E harness | `scripts/verify-interactions.js` (Playwright) |
| Static server for tests | `scripts/static-server.js` |
| CI workflow | `.github/workflows/ci.yml` |
| Vercel security headers | `vercel.json` |

## Gates you must run before claiming work is done

1. `pnpm exec tsc --noEmit` — clean
2. `pnpm test` — all green
3. For non-trivial UI changes: `pnpm build` then verify-interactions

If you can't actually run a step (e.g., no browser available), say so
explicitly rather than claiming success.

## Known flakes

- `verify-interactions.js` occasionally times out on `waitUntil:
  'networkidle'` in CI/local — retry once before declaring a regression.
- Playwright Chromium binary path varies by version. `pnpm-lock.yaml`
  is the source of truth; if `npx playwright install` runs slow, check
  `~/.cache/ms-playwright` for an existing matching binary first.

## What to push back on

- Requests to add a runtime (server, database, API route) — propose a
  static alternative first.
- Requests to deploy publicly without first checking the legal /
  hosting-provider situation — see README.
- Requests to "improve" `public/css/main.css` or `vendors.css` — those
  are read-only.
- Anything that bundles unrelated changes into one PR — small focused
  PRs land faster.

## Backlog reference

The active improvement plan lives in conversation history under
"Phase 1 — Stop-the-bleeding," "Phase 2 — Make it findable," etc.
Current focus is Phase 1 items: botcheck honeypot (#2), CI (#4),
security headers (#3), docs (#10 — this file).
