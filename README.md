# napsgear-v1

A Next.js 16 static-export storefront. Catalog, product detail, cart, and
checkout — all pre-rendered at build time and served from a CDN with no
backend.

> ⚠ This repo clones the look and content of a third-party site. Before
> deploying to a real domain, review the legal and brand-rights situation
> for your jurisdiction.

## Tech stack

| Layer | Library | Notes |
|---|---|---|
| Framework | Next.js 16 (App Router) | `output: 'export'` — fully static |
| UI primitives | Radix Dialog/Label/Slot | Used sparingly; most UI is `.ngc-` CSS |
| Listing | `@tanstack/react-table` | Powers `/catalog/`, `/brands/*`, `/categories/*` |
| Forms | `@tanstack/react-form` | Drives checkout with per-field blur validation |
| Carousels | Swiper 11 (npm) | No more offline webpack bundle |
| Icons | lucide-react | Tree-shaken |
| Cart state | React Context + `localStorage` | Hydration-aware via `useCart().hydrated` |
| Order email | Web3Forms (free tier) | Pre-launch: migrate to Resend (see Phase 4 backlog) |
| Tests | Vitest + Playwright | 131 unit, 18 E2E, all gated in CI |

## Quick start

Requirements: **Node 22**, **pnpm 10** (locked via `packageManager` field).

```bash
pnpm install
cp .env.local.example .env.local   # paste your Web3Forms key
pnpm dev                           # http://localhost:3000
```

## Scripts

```bash
pnpm dev            # Next dev server
pnpm build          # Static export -> ./out
pnpm test           # Vitest (run mode)
pnpm lint           # Next ESLint
pnpm extract        # scripts/extract-brand.ts — pulls a single brand
pnpm scrape         # scripts/scrape-napsgear.ts — full product crawl
```

### Verification harness (Playwright)

```bash
pnpm build
node scripts/static-server.js ./out 4173 &
VERIFY_BASE=http://localhost:4173 node scripts/verify-interactions.js
```

This runs the 18 end-to-end checks (sliders, nav, cart persistence, checkout
flow, F1/F2a/F2b/F3 regression suites). CI runs the same harness on every PR.

## Project layout

```
src/
├── app/                  # Next App Router routes (all server components unless 'use client')
│   ├── cart/             # /cart/ — full cart view
│   ├── catalog/          # /catalog/ — all products (TanStack Table)
│   ├── checkout/         # /checkout/ — TanStack Form + Web3Forms submit
│   ├── brands/[slug]/    # /brands/<brand>/ — filtered listing
│   ├── categories/[slug]/# /categories/<slug>/
│   ├── [productSlug]/    # /<product-slug>/ — PDP with pack tiers
│   └── globals.css       # .ngc- design system + overrides (~1.6k lines)
├── components/           # Reusable client components
├── context/CartContext.tsx # Cart state + localStorage persistence
├── data/                 # Bundled product/brand/category JSON
├── hooks/                # useSwiper, useStickyHeader
└── lib/                  # Pure helpers (all vitest-tested)
    ├── cart.ts           # subtotal, shipping, loyalty, total
    ├── pricing.ts        # parsePrice, packTiers
    ├── checkout.ts       # validateCheckout, buildOrderPayload
    ├── orderEmail.ts     # render* composers for the Web3Forms body
    └── productTable.helper.ts # filter/sort predicates for TanStack Table
public/
├── css/                  # Legacy Bootstrap (vendors.css) + scraped main.css
├── images/products/      # Product thumbnails
└── ...
scripts/                  # Build-time data extraction and verification
.github/workflows/        # CI: typecheck · vitest · build · Playwright
```

## Conventions

- **Pure logic lives in `src/lib/`** with a colocated `*.test.ts`. Anything
  testable in Node belongs there, not in components.
- **Components are dumb.** Page components fetch from `@/data` and pass
  static props; client components handle interactivity.
- **`.ngc-` design system** is the modern layer in `globals.css`. Legacy
  Bootstrap (`vendors.css`) is still loaded until rollout completes.
- **Branch per feature** → PR → merge to master. CI must be green.
- **Static export only** — no API routes, no server actions, no middleware.

## Environment

Only one env var matters at build time:

```ini
NEXT_PUBLIC_WEB3FORMS_KEY=your-access-key   # see .env.local.example
```

It's inlined into the client bundle by design — Web3Forms keys are public
and only authorize sending to the inbox you registered.

## Deployment

Vercel auto-detects pnpm via `pnpm-lock.yaml`. Build command: `pnpm build`.
Output: `out/`. Security headers and asset cache rules ship via
`vercel.json` (see file for the full CSP).

## Testing

| Layer | Command | Coverage |
|---|---|---|
| Unit (pure logic) | `pnpm test` | cart math, pricing tiers, checkout validation, order email render, productTable predicates, scrollToTop helper |
| End-to-end | `node scripts/verify-interactions.js` | sliders, nav, cart persistence, checkout flow, every F-feature regression |
| Typecheck | `pnpm exec tsc --noEmit` | strict mode |

CI gates all three on every PR via `.github/workflows/ci.yml`.

## License

Private / unpublished. Not for redistribution.
