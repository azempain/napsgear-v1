# Site Grabber — Design Spec

**Date:** 2026-04-28
**Status:** Approved

## Problem

HTTrack cannot bypass Cloudflare bot protection, misses assets loaded by JavaScript (SPAs), and has no way to inherit an existing browser session. The result is broken offline mirrors with missing CSS/JS/images.

## Goal

A Python CLI script that crawls any website — static, SPA, Cloudflare-protected, authenticated — and produces a fully offline-browsable local folder.

## Approach

Python + Playwright (real Chromium). Intercept every network response as the browser loads pages, save assets to a mirrored folder structure, extract rendered links from the live DOM (after JS runs), BFS-crawl same-domain pages until queue is empty or a limit is hit, then rewrite all absolute URLs to relative paths.

---

## Architecture

### File Structure

```
grab.py              ← CLI entry point (click)
crawler.py           ← BFS queue, visited set, same-domain link extraction
interceptor.py       ← network response capture, file writing
rewriter.py          ← post-process HTML/CSS URL rewriting, SVG inlining
cookies.py           ← load cookies.json and inject into Playwright context
requirements.txt     ← playwright, click, tqdm
```

### Core Flow

1. Start Playwright Chromium with `page.on("response")` interception active
2. Optionally pre-load cookies from `--cookies FILE` (for Cloudflare/auth)
3. Visit seed URL; wait for network idle (catches SPA lazy loads)
4. Capture every network response into `output/<url-path>`
5. Extract all same-domain `<a href>` links from the **rendered** DOM
6. Add unseen links to BFS queue (respecting `--include`/`--exclude` patterns)
7. Repeat until queue empty, `--max-pages` hit, or `--depth` exceeded
8. Post-process: rewrite absolute URLs in all HTML and CSS files to relative paths
9. Inline SVG `<use>` sprites into each HTML file (prevents file:// cross-origin block)

---

## CLI

```
python grab.py <url> [options]

Options:
  --output DIR        Output directory (default: ./output)
  --max-pages N       Stop after N pages (default: unlimited)
  --depth N           Max link depth from seed URL (default: unlimited)
  --wait-for idle|N   Wait for network idle or N ms after load (default: idle)
  --cookies FILE      Path to cookies.json (Netscape or Chrome JSON format)
  --concurrency N     Parallel browser tabs (default: 1)
  --include PATTERN   Only follow URLs matching glob pattern (e.g. /blog/*)
  --exclude PATTERN   Skip URLs matching glob pattern (e.g. /cart/*)
```

---

## Asset Interception

`page.on("response")` fires for **every** network response, regardless of domain. This means CDN assets (e.g. `cdn.example.com/css/main.css`, `fonts.googleapis.com`, image CDNs) are captured automatically just by loading the page — no separate crawl of those domains is needed. Crawling for new *pages* to visit is limited to the seed hostname, but asset capture is unrestricted.

For each response:

- **URL → local path:** Strip query strings, map to `output/<path>` preserving directory structure
- **Binary assets** (images, fonts, woff2, ico): written as raw bytes
- **Text assets** (HTML, CSS, JS, SVG): written as UTF-8
- **Non-200 responses:** logged to stderr, skipped (no crash)
- **Redirects:** followed automatically by Playwright

---

## URL Rewriting (post-process)

After crawling, one pass over all saved files:

**HTML:** `href="https://example.com/foo/bar"` → relative path based on current file depth (e.g. `../../foo/bar`)

**CSS:** `url("https://example.com/img/bg.jpg")` → relative path

**SVG `<use>` sprites:** if an HTML file references an external `.svg` file via `<use href="path/to/sprite.svg#icon-name">`, inline the SVG content into `<body>` and rewrite all references to `href="#icon-name"` — this is required for `file://` browsing where browsers block external SVG `<use>` loads.

---

## Cloudflare Bypass

Real Chromium passes most Cloudflare JS challenges automatically. For sites that still block:

1. Visit the site in your real Chrome, open DevTools → Application → Cookies
2. Use any "Export Cookies JSON" extension to save cookies
3. Pass to the script: `python grab.py https://example.com --cookies cookies.json`

Cookies are loaded into the Playwright browser context before the first page visit, inheriting `cf_clearance` and session cookies.

---

## Progress Output

Live tqdm progress bar showing:
- Pages crawled / queued
- Assets saved
- Current URL being processed

Errors printed to stderr without interrupting the crawl.

---

## Out of Scope

- Capturing pages behind login forms (user must pre-load auth cookies via `--cookies`)
- Infinite scroll / "load more" pagination (pages are captured at network-idle state only)
- JavaScript execution simulation beyond what Playwright's real Chromium handles naturally
- Windows installer / packaging
