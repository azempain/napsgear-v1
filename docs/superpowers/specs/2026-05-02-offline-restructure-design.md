# NapsGear Offline Restructure & Next.js Migration Design

**Date:** 2026-05-02  
**Status:** Approved  
**Author:** Claude (brainstorming session)

---

## Problem Statement

The NapsGear project currently has:
- One working offline HTML page (`www.napsgear.org/index.html`) captured by HTTrack
- A Playwright-based grabber toolchain for downloading additional pages
- Several unfixed errors (missing favicon, dead nav links, empty YouTube thumbnails, Cloudflare script noise, broken Windows paths in grabber)
- No structure for co-locating a Next.js app alongside the offline HTML

The goal is to: fix all errors, expand the offline site to cover key nav pages + product/category browsing, reorganise the project into a clean monorepo layout, and scaffold a Next.js 16 app alongside it ready for page-by-page migration.

---

## Scope

**Offline site pages:**
- Homepage
- FAQ
- Shipping Information
- Why Naps?
- Contact Us
- Ask an IFBB Pro
- Brand pages (all brands listed in the Brands mega-menu)
- Category pages (all categories listed in the Categories mega-menu)
- Individual product detail pages

**All internal links rewritten** to local relative paths — no `https://www.napsgear.org/` references remain in any served HTML file.

**PHP-dependent features** (search, cart, login, Q&A) left as silent failures in the offline HTML. They will be fully implemented in Next.js.

**Page acquisition strategy:** Manual targeted list — specific URLs added to `grabber/targets.txt`, downloaded individually using the grabber tool. No full BFS crawl.

---

## Architecture: Monorepo with Clean Separation

```
napsgear/
├── offline/                        ← complete offline HTML site
│   ├── index.html                  ← homepage
│   ├── templates/                  ← CSS, JS, SVG icons, images
│   │   ├── css/
│   │   ├── js/
│   │   └── img/
│   │       ├── icons/icons-lib.svg
│   │       ├── banners/
│   │       ├── vimeo/
│   │       └── youtube/
│   ├── cdn.napsgear.org/           ← CDN product image thumbnails
│   ├── faq/index.html
│   ├── shipping-information/index.html
│   ├── why-naps/index.html
│   ├── contact-us/index.html
│   ├── ask-an-ifbb-pro/index.html
│   ├── brands/
│   │   └── [brand-slug]/index.html
│   ├── categories/
│   │   └── [category-slug]/index.html
│   └── [product-slug]/index.html   ← mirrors live URL path structure
│
├── app/                            ← Next.js 16 application
│   ├── package.json
│   ├── next.config.ts
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   ├── public/                     ← static assets (favicon, shared images)
│   └── src/
│       ├── app/                    ← App Router pages
│       │   ├── layout.tsx
│       │   ├── page.tsx
│       │   ├── faq/page.tsx
│       │   ├── shipping-information/page.tsx
│       │   ├── why-naps/page.tsx
│       │   ├── contact-us/page.tsx
│       │   ├── ask-an-ifbb-pro/page.tsx
│       │   ├── brands/[slug]/page.tsx
│       │   ├── categories/[slug]/page.tsx
│       │   └── [productSlug]/page.tsx
│       └── components/
│           ├── Header.tsx
│           ├── MainNav.tsx
│           ├── MobileNav.tsx
│           ├── HeroCarousel.tsx
│           ├── VideoCard.tsx
│           ├── ProductCard.tsx
│           ├── LoginModal.tsx
│           ├── CartDrawer.tsx
│           ├── Footer.tsx
│           └── Toast.tsx
│
├── data/                           ← shared structured JSON data
│   ├── brands.json
│   ├── categories.json
│   ├── products.json
│   └── videos.json
│
├── grabber/                        ← crawl/fix toolchain (existing)
│   ├── grab.py                     ← CLI entry point (updated)
│   ├── crawler.py                  ← BFS + targeted modes (updated)
│   ├── interceptor.py              ← asset capture (updated)
│   ├── rewriter.py                 ← URL rewriting (updated)
│   ├── cookies.py
│   ├── targets.txt                 ← list of URLs to grab (new)
│   ├── requirements.txt
│   ├── README.md
│   └── tests/
│
├── scripts/
│   ├── fix_offline.py              ← moved from root, updated
│   ├── check_offline.py            ← new: broken-link reporter
│   └── extract_data.py             ← new: HTML → JSON data extraction
│
└── tests/                          ← existing fix_offline tests (updated paths)
```

---

## Offline Pipeline

Three phases, run in sequence after each batch of page acquisitions.

### Phase 1 — Grab

```bash
python grabber/grab.py --targets grabber/targets.txt --output offline/ --skip-existing
```

- Reads URLs from `targets.txt` (one per line, `#` comments and blank lines ignored)
- When `--targets` is provided, skips BFS entirely — visits exactly the listed URLs
- For each URL: renders with Chromium, intercepts all asset responses, saves HTML after JS execution
- Assets (CSS, JS, images, fonts) saved relative to their URL structure
- `--skip-existing` prevents overwriting already-fixed HTML files and already-downloaded assets

### Phase 2 — Fix

```bash
python scripts/fix_offline.py --root offline/
```

Walks every `.html` file under `offline/` and applies these transforms in order:

| # | Transform | Details |
|---|-----------|---------|
| 1 | **Internal URL rewrite** | `https://www.napsgear.org/foo` → relative path if `offline/foo/index.html` exists on disk, else `./foo/` (root-relative graceful fallback) |
| 2 | **Asset URL rewrite** | CDN `src`/`href` → relative local paths |
| 3 | **Inline style rewrite** | `style="background-image: url('https://...')"` → local relative path |
| 4 | **Font Awesome fix** | Inject CSS border-arrow override into `<head>` (idempotent, checks marker before injecting) |
| 5 | **SVG icon fix** | `icons-lib.svg#name` → `#name` (inline resolution) |
| 6 | **Cloudflare strip** | Remove `<script src="/cdn-cgi/...">` tags entirely |
| 7 | **Video thumbnails** | Download missing Vimeo/YouTube thumbnails, rewrite `src`/`background-image` |
| 8 | **Favicon fix** | Replace broken `<link rel="favicon" href="...favicon.ico">` with correct `<link rel="icon">` pointing to downloaded favicon, or remove if not downloaded |

The URL rewrite in step 1 builds a manifest of all `.html` files present in `offline/` at the time of running, so only links to actually-downloaded pages are rewritten to local paths.

### Phase 3 — Verify

```bash
python scripts/check_offline.py --root offline/
```

- Crawls every `.html` file in `offline/`
- Parses all `href`, `src`, `url()`, and `srcset` values
- Reports any that still point to `https://` or to a local path that does not exist on disk
- Exits with code 1 if any broken references are found (CI-friendly)
- Prints a summary table: file path | attribute | broken value

---

## Error Inventory & Fixes

All known bugs, with fix location:

| # | Bug | Severity | Fix |
|---|-----|----------|-----|
| 1 | Cloudflare `cdn-cgi/` URLs crash interceptor with Windows path error | High | Fixed in `interceptor.py` — skip `cdn-cgi/` prefix URLs |
| 2 | Colons/reserved chars in Cloudflare URL paths break Windows filenames | High | Fixed in `interceptor.py` — sanitize path segments |
| 3 | No `--skip-existing` flag — grabber overwrites hand-fixed HTML | High | Fixed in `grab.py` |
| 4 | No `--targets` file support — can only crawl one URL at a time | High | Add to `grab.py` + `crawler.py` |
| 5 | `fix_offline.py` hardcoded to `www.napsgear.org/` — breaks after rename | High | Update to accept `--root` arg, default `offline/` |
| 6 | All nav/product `href` point to `https://www.napsgear.org/` | High | Phase 2 transform #1 |
| 7 | Favicon `<link>` references missing `favicon.ico` | Low | Phase 2 transform #8: download `https://www.napsgear.org/favicon.ico` to `offline/templates/img/favicon.ico`, rewrite `<link rel="favicon">` to correct `<link rel="icon" href="...">` |
| 8 | Cloudflare challenge `<script>` tag present | Medium | Phase 2 transform #6 |
| 9 | YouTube thumbnails directory empty | Medium | Phase 2 transform #7 |
| 10 | `rewriter.py` misses inline `style=` background-image URLs | Medium | Extend `rewrite_html_urls()` |
| 11 | `grabber/crawler.py` BFS-only, no targeted URL list mode | High | Add `targets` mode |
| 12 | Font Awesome Pro fonts missing site-wide | High | Already fixed with CSS override — apply to all pages via Phase 2 |
| 13 | `www.napsgear.org/stats/index.html` is an empty stub | Low | Exclude from `offline/` on migration |
| 14 | `new/` directory at project root — unused asset duplicates | Low | Delete during restructure |

---

## Grabber Changes

### `grab.py` — new `--targets` option

```
python grab.py --targets FILE --output DIR [--skip-existing] [--wait-for idle|N]
```

When `--targets` is provided:
- Ignores `URL` positional argument
- Reads URLs from `FILE`, one per line; skips blank lines and lines starting with `#`
- Visits each URL exactly once (no BFS link extraction)
- All other options (`--skip-existing`, `--wait-for`, `--cookies`) still apply

### `interceptor.py` — Windows-safe paths + Cloudflare skip

- `is_skip_url()`: returns `True` for any URL whose path starts with `/cdn-cgi/`
- `_sanitize_path_segment()`: replaces `< > : " / \ | ? *` with `_` in each path segment
- Skip-existing: if local file already exists with `size > 0`, mark as saved and skip download

### `crawler.py` — targets mode

- New `Crawler.from_targets(urls)` class method: loads a fixed list, no BFS
- Existing BFS mode unchanged

### `rewriter.py` — inline style URLs

- `rewrite_html_urls()` extended to also match `style="[^"]*url\('?(https?://[^')]+)'?[^"]*"`
- Rewrites background-image and other inline style URL references to relative paths

---

## Next.js 16 App Scaffold

### Stack

| Tool | Version | Notes |
|------|---------|-------|
| Next.js | 16.2.2 (latest) | App Router, static export |
| React | 19 | Required minimum for Next.js 16 |
| TypeScript | 5.x | Strict mode |
| Tailwind CSS | v4 | Replaces existing CSS over time |
| Turbopack | stable | Default dev bundler in Next.js 16 |

### `next.config.ts`

```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'export',        // fully static — no server required
  trailingSlash: true,     // /foo → /foo/index.html — works on file://
  turbopack: {},           // stable in Next.js 16, moved from experimental
}

export default nextConfig
```

### Routing

App Router file-based routing mirrors the offline site structure exactly, making migration a direct port:

| Offline file | Next.js route |
|-------------|--------------|
| `offline/index.html` | `app/src/app/page.tsx` |
| `offline/faq/index.html` | `app/src/app/faq/page.tsx` |
| `offline/shipping-information/index.html` | `app/src/app/shipping-information/page.tsx` |
| `offline/why-naps/index.html` | `app/src/app/why-naps/page.tsx` |
| `offline/contact-us/index.html` | `app/src/app/contact-us/page.tsx` |
| `offline/ask-an-ifbb-pro/index.html` | `app/src/app/ask-an-ifbb-pro/page.tsx` |
| `offline/brands/[slug]/index.html` | `app/src/app/brands/[slug]/page.tsx` |
| `offline/categories/[slug]/index.html` | `app/src/app/categories/[slug]/page.tsx` |
| `offline/[name]-c[id]/index.html` | `app/src/app/[productSlug]/page.tsx` |

Product URL slug pattern follows the live site convention: `[product-name]-c[numeric-id]` (e.g. `testosterone-enanthate-c141952`). The `[productSlug]` dynamic segment captures this entire string.

### Data Layer

`data/*.json` files are the single source of truth for both the offline site (embedded as `<script type="application/json">` blocks) and the Next.js app (imported at build time for `generateStaticParams`).

| File | Schema summary | Populated from |
|------|---------------|----------------|
| `data/brands.json` | `[{ slug, name, url, badge? }]` | Brands mega-menu in `offline/index.html` |
| `data/categories.json` | `[{ slug, name, children[] }]` | Categories mega-menu in `offline/index.html` |
| `data/products.json` | `[{ slug, name, brand, category, images[], description, price? }]` | Grabbed product detail pages — starts as `[]`, populated incrementally as product pages are grabbed and `extract_data.py` is run |
| `data/videos.json` | `[{ id, title, url, thumbnail, duration?, date }]` | AMA carousel in `offline/index.html` |

`scripts/extract_data.py` — BeautifulSoup-based script that parses offline HTML files and writes the JSON files. Run after each grab batch.

### Component Map

Ten components identified from HTML structure, each a single file:

| Component | Source elements | Key props |
|-----------|----------------|-----------|
| `Header` | `#header .header-middle` | — |
| `MainNav` | `#mainMenuNav` | `brands`, `categories` (from data) |
| `MobileNav` | `#navigationMenu` | same |
| `HeroCarousel` | `.hp-slider.swiper` | `slides[]` |
| `VideoCard` | `.post` in AMA section | `video: Video` |
| `ProductCard` | `.widget-gearpics__item` | `product: Product` |
| `LoginModal` | `#loginModal` | — (offline: display-only) |
| `CartDrawer` | `#shoppingCartBox` | — (offline: display-only) |
| `Footer` | `.footer` | — |
| `Toast` | `.notification` | `message`, `type` |

---

## Migration Strategy

The offline HTML and Next.js app are independent — no shared runtime. Migration is page-by-page:

1. Pick a page (e.g. FAQ)
2. Read `offline/faq/index.html` as the visual reference
3. Write `app/src/app/faq/page.tsx` + any new components
4. Run `next build` — static HTML output in `app/out/`
5. Visually compare against offline reference
6. Once all pages migrated, the offline site is retired

The offline site is the source of truth for design. The Next.js app is the target.

---

## Out of Scope

- Search, cart, login, Q&A — these will be built in Next.js, not the offline HTML
- Authentication / user accounts
- Payment processing
- Real-time inventory
- Automated full-site BFS crawl (manual targeting chosen)
