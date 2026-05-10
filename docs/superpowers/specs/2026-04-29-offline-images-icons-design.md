# NapsGear Offline — Images, Icons & YouTube Thumbnails

**Date:** 2026-04-29
**Status:** Approved

## Problem

`www.napsgear.org/index.html` has three remaining offline breakages after the prior template asset fix:

1. **Product/customer images show as white boxes** — all `<img>` tags referencing `https://cdn.napsgear.org/` fail offline even though the files exist locally under `cdn.napsgear.org/`.
2. **Nav dropdown and other icons show as □** — `<use href="templates/img/icons/icons-lib.svg#icon-name">` references are blocked by browsers on the `file://` protocol (cross-document SVG restriction). The symbols are already defined inline in the HTML's own `<svg>` block; the references just point to the wrong place.
3. **YouTube video thumbnails are blank** — `<img src="https://i.ytimg.com/vi/VIDEO_ID/...jpg">` tags fail offline; no local copies exist.

## Approach: Approach A — Inline SVG + local thumbnails (no new libraries)

All three fixes are pure HTML/asset changes. No build step, no new dependencies.

---

## Fix 1: CDN Image URL Rewrite

**File:** `www.napsgear.org/index.html`

Replace every occurrence of `https://cdn.napsgear.org/` with `../cdn.napsgear.org/` using a Python script. The local CDN mirror is at `cdn.napsgear.org/` (sibling directory to `www.napsgear.org/`), so one level up (`../`) is correct.

Also replace `http://cdn.napsgear.org/` and `//cdn.napsgear.org/` in the same pass to catch any protocol-relative variants.

**Verification:** Zero `cdn.napsgear.org` absolute URL references remain in the HTML after the rewrite.

---

## Fix 2: SVG Icon Reference Repair

**Files:** `www.napsgear.org/index.html`, `www.napsgear.org/templates/img/icons/icons-lib.svg`

**Step 1 — Fix references:** Replace every `href="templates/img/icons/icons-lib.svg#` with `href="#` in the HTML. This redirects all icon `<use>` calls to the inline `<svg>` block already present in the document.

**Step 2 — Fill missing symbols:** Parse `icons-lib.svg` and the inline `<svg>` block in the HTML. For any `<symbol>` that exists in the SVG file but is absent from the inline block, append it to the inline block. This ensures no icon is lost.

**Verification:** No `icons-lib.svg#` references remain in the HTML. All icons that were □ now render correctly.

---

## Fix 3: YouTube Thumbnail Download & Rewrite

**New directory:** `www.napsgear.org/templates/img/youtube/`

**Step 1 — Extract:** Scan `index.html` for all `https://i.ytimg.com/vi/VIDEO_ID/` URLs, collect unique video IDs.

**Step 2 — Download:** For each video ID, download the highest-quality available thumbnail in order of preference: `maxresdefault.jpg` → `hqdefault.jpg` → `mqdefault.jpg`. Save as `templates/img/youtube/VIDEO_ID.jpg`.

**Step 3 — Rewrite:** Replace each `src="https://i.ytimg.com/vi/VIDEO_ID/[variant].jpg"` in the HTML with `src="templates/img/youtube/VIDEO_ID.jpg"`.

YouTube watch links (`href="https://www.youtube.com/..."`) are left unchanged — playback requires internet, which is acceptable.

**Verification:** Zero `i.ytimg.com` references remain in the HTML. All video cards show a thumbnail image.

---

## Out of Scope

- Making YouTube video playback work offline
- Making search, login, cart, or other dynamic API features work offline
- Downloading pages beyond `index.html`
- Adding Font Awesome or any icon library (existing inline SVG symbols are sufficient once references are fixed)
