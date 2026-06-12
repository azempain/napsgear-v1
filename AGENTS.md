# AGENTS.md — guidance for AI assistants

This file is loaded by Codex (and similar tools) on every session.
It captures non-obvious conventions and constraints that aren't visible
from the code alone.

## What this project is

A Next.js 16 **static export** (`output: 'export'`) storefront. Pre-renders
to `out/` at build time, served from a CDN. No backend, no API routes, no
middleware, no server actions. Everything is client-side after hydration.

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

5. **Don't commit `.env.local`.** The Web3Forms key it contains is gated
   to a specific inbox but still shouldn't be in git history.

6. **Branch per feature → PR → merge to master.** CI must be green
   (`.github/workflows/ci.yml`). The trailer
   `Co-Authored-By: Codex Opus <noreply@anthropic.com>` goes on every
   commit you author.

## Soft rules / conventions

- **`.ngc-` design system** is the modern CSS layer in `globals.css`.
  Components written today should use `.ngc-*` classes; the legacy
  Bootstrap layer (`vendors.css`) will eventually be removed.
- **Component file size.** Most components are <200 lines. If a component
  grows past that, extract a hook or split sub-components.
- **No `dangerouslySetInnerHTML`.** Ever. There's no current usage; keep
  it that way.
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
