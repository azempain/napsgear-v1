# Spec: Localize All napsgear.org URLs

**Date:** 2026-05-09
**Status:** Approved

## Goal

Remove every `https://www.napsgear.org/` and `https://napsgear.org/` URL from the source code and replace with local relative paths. No link should leave the local dev app at `localhost:3000`.

## Approach

Direct source replacement via a one-time script. No runtime utility, no redirect config. The result is clean source files that `git diff` can fully audit.

## URL Mapping Rules (applied in priority order)

| Pattern | Local path | Notes |
|---|---|---|
| `…/ama.php…` | `/ask-an-ifbb-pro/` | Drop query params |
| `…/qa.php…` | `#` | No local Q&A route yet |
| `…/why-naps/` | `/why-naps/` | Route exists |
| `…/contact-us/` | `/contact-us/` | Route exists |
| `…/{slug}-p{number}` | `/{slug}` | Product pages via `[productSlug]` route |
| `…/{slug}-c{number}` in brand context | `/brands/{slug}` | Slug = everything before `-c{number}` |
| `…/{slug}-c{number}` in category context | `/categories/{slug}` | Slug = everything before `-c{number}` |
| `advanced_search_result.php` | `#` | No local search route |
| Everything else | `#` | Promo/info pages not yet built |

## Context Detection (brands vs categories)

The same URL pattern (`/SLUG-cNUMBER`) is used for both brands and categories. Context is determined by which file or section the URL appears in:

- **Brand context:** `HeaderNav.tsx` brand `<ul>` block, `brands.json`, `MainNav.tsx` brand section
- **Category context:** `HeaderNav.tsx` category `<ul>` block, `categories.json`
- **Shipping/other context:** `HeaderNav.tsx` shipping block → slug kept, mapped to closest brand/category or `#`

## Files Changed

| File | Hits | Primary action |
|---|---|---|
| `HeaderNav.tsx` | 61 | Brand→`/brands/`, category→`/categories/`, promo/info→`#`, AMA→`/ask-an-ifbb-pro/` |
| `MainNav.tsx` | 10 | Same mapping as HeaderNav |
| `Header.tsx` | 1 | Search form action → `#` |
| `HeroCarousel.tsx` | 3 | Slide links → local or `#` |
| `HeroSlideProductOfWeek.tsx` | 1 | Product URL → `/{slug}` |
| `AmaSection.tsx` | 1 | "See more videos" → `/ask-an-ifbb-pro/` |
| `GearpicsSection.tsx` | 1 | `#` |
| `GearpicItem.tsx` | 1 | `#` |
| `QaSection.tsx` | 1 | `#` |
| `brands.json` | 60 | `url` field → `/brands/{slug}` |
| `categories.json` | 120 | `url` field → `/categories/{slug}` |
| `qa-posts.json` | 10 | `url` field → `#` |
| `videos.json` | 8 | `url` field → `/ask-an-ifbb-pro/` |

## Out of Scope

- Creating new pages for unbuilt routes (Q&A, gearpics, promotions, etc.) — those get `#` now and can be built later
- Changing the live napsgear.org site in any way
- Adding redirects to `next.config.js`

## Success Criteria

- `grep -r "napsgear.org" app/src/` returns zero results
- All nav dropdowns, hero carousel links, and data-driven cards link to local paths or `#`
- No broken routing errors in the browser console from missing routes
