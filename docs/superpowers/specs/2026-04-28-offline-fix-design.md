# NapsGear Offline Mirror Fix — Design Spec

**Date:** 2026-04-28
**Status:** Approved

## Problem

The HTTrack mirror at `www.napsgear.org/index.html` loads 3 CSS files, 7 JS files, 1 SVG icon library, and 2 banner images via absolute `https://www.napsgear.org/templates/...` URLs. These fail offline, leaving the page as an unstyled skeleton. Product thumbnail images are already stored locally with correct relative paths.

## Approach

Download all 13 missing template assets directly from the live site, store them locally preserving directory structure, then rewrite all absolute template references in the HTML to relative paths.

## Assets to Download

All fetched from `https://www.napsgear.org/templates/` and saved to `www.napsgear.org/templates/`:

**CSS**
- `css/swiper.14bf534d.css`
- `css/vendors.890e34f1.css`
- `css/main.68a342d0.css`

**JS**
- `js/vendors/jquery/jquery.min.js`
- `js/runtime.1d7d4f4c.js`
- `js/bootstrap.a5c01dae.js`
- `js/swiper.66c68bb9.js`
- `js/dayjs.ffe16fd0.js`
- `js/vendors.dbb1a691.js`
- `js/main.7936197f.js`

**SVG**
- `img/icons/icons-lib.svg`

**Images**
- `img/banners/homepage/banner-ama.jpg`
- `img/banners/homepage/top-weight-loss/top-weight-loss.jpg`

## HTML Changes (`www.napsgear.org/index.html`)

1. Rewrite all `https://www.napsgear.org/templates/...` → `templates/...` (relative)
2. Remove Matomo tracker `<script>` block and noscript pixel (tracker is meaningless offline)
3. Navigation links (`https://www.napsgear.org/...`) left as-is — they won't navigate offline but don't break display

## Post-Download Check

Grep the downloaded JS bundles for hardcoded `www.napsgear.org` absolute URLs. Patch any found so they don't generate console errors or broken requests offline.

## Out of Scope

- Making search, login, cart, or other dynamic features work offline (they require the live server)
- Downloading pages beyond `index.html` (only one page was mirrored)
