// Full-site NapsGear source scraper.
//
//   npm run scrape
//
// Strategy
//   1. Open a persistent Chromium profile so the Cloudflare clearance cookie
//      survives between runs. First run: solve the challenge once in the
//      visible window. Subsequent runs: no prompt.
//   2. Discover brand + category list pages from the home page nav.
//   3. For each list page, follow pagination (?page=N or .pages-item-next),
//      parse cards with the existing parseBrandPage(html) parser.
//   4. For every unique product URL, visit the detail page and parse with
//      parseDetailPage(html) — gives description, ingredient, packs, reviews,
//      Q&A. Merge into the list-page products via applyDetails().
//   5. Write src/data/products.json and src/data/ingredients.json.
//
// Notes
//   - The parsers in src/lib/extract.ts are pure HTML→JSON, designed for the
//     existing extract-brand.ts CLI; we feed them page.content() snapshots.
//   - Image URLs are localised by the parser to /images/products/<basename>.
//     After this script finishes, run `node scripts/download-images.js` to
//     fetch the binaries into public/images/products/.

import { chromium, type BrowserContext, type Page } from 'playwright'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'
import { load } from 'cheerio'
import {
  parseBrandPage,
  parseDetailPage,
  applyDetails,
  slugFromUrl,
  type DetailPageResult,
} from '../src/lib/extract'
import type { Product, Ingredient } from '../src/data/types'

const ROOT = path.join(__dirname, '..')
const DATA_DIR = path.join(ROOT, 'src/data')
const BASE_URL = 'https://www.napsgear.org'
const DUMP_DIR = path.join(os.tmpdir(), 'napsgear-dump')
const PROFILE_DIR = path.join(os.tmpdir(), 'napsgear-profile')
fs.mkdirSync(DUMP_DIR, { recursive: true })
fs.mkdirSync(PROFILE_DIR, { recursive: true })

// ── Cloudflare gate ──────────────────────────────────────────────────────────

async function isOnCloudflareChallenge(page: Page): Promise<boolean> {
  try {
    const title = await page.title()
    if (/just a moment|checking your|attention required/i.test(title)) return true
    return await page.evaluate(() => {
      if (document.querySelector('#challenge-form, #challenge-running, #cf-challenge-running')) return true
      if (document.querySelector('iframe[src*="challenges.cloudflare.com"]')) return true
      if (document.querySelector('iframe[src*="/cdn-cgi/challenge-platform/"]')) return true
      return false
    })
  } catch {
    return false
  }
}

async function waitForCloudflare(page: Page, timeout = 300_000): Promise<void> {
  const start = Date.now()
  let warned = false
  while (Date.now() - start < timeout) {
    if (!(await isOnCloudflareChallenge(page))) return
    if (!warned && Date.now() - start > 8_000) {
      console.log('   🛂  Cloudflare challenge visible — solve it in the browser window if asked.')
      warned = true
    }
    await page.waitForTimeout(2_000)
  }
  throw new Error('Cloudflare challenge did not clear within 5 min')
}

async function safeGoto(page: Page, url: string): Promise<void> {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 })
  await waitForCloudflare(page)
  await page.waitForTimeout(600) // small settle for late-rendered DOM
}

function dumpHtml(html: string, name: string): void {
  const safe = name.replace(/[^\w-]+/g, '_').slice(0, 80)
  fs.writeFileSync(path.join(DUMP_DIR, `${safe}.html`), html)
}

// ── List-page discovery ──────────────────────────────────────────────────────

async function getListPageUrls(page: Page): Promise<string[]> {
  await safeGoto(page, BASE_URL)
  dumpHtml(await page.content(), 'homepage')
  return page.evaluate((base: string) => {
    const out = new Set<string>()
    document.querySelectorAll<HTMLAnchorElement>('a[href]').forEach((a) => {
      const href = a.getAttribute('href') ?? ''
      const full = href.startsWith('http')
        ? href
        : href.startsWith('/') ? base + href : ''
      if (!full || !full.startsWith(base)) return
      // Accept only top-level brand / category index pages, not nested filter URLs
      if (
        /\/brands\/[^/?#]+\/?$/i.test(full) ||
        /\/categories\/[^/?#]+\/?$/i.test(full)
      ) {
        out.add(full.replace(/\/+$/, '') + '/')
      }
    })
    return [...out]
  }, BASE_URL)
}

// ── List-page scraper (with pagination) ──────────────────────────────────────

/** Pull detail-page URLs from a brand/category page HTML, keyed by slug. */
function extractDetailUrls(html: string): Record<string, string> {
  const $ = load(html)
  const out: Record<string, string> = {}
  $('.product-item').each((_, el) => {
    const a = $(el).find('.product-item__title a').first()
    const href = a.attr('href') ?? ''
    if (!href) return
    const slug = slugFromUrl(href)
    const full = href.startsWith('http') ? href : (href.startsWith('/') ? BASE_URL + href : `${BASE_URL}/${href}`)
    out[slug] = full
  })
  return out
}

interface ListResult {
  products: Product[]
  ingredients: Ingredient[]
  urls: Record<string, string>
}

async function scrapeListWithPagination(page: Page, startUrl: string, label: string): Promise<ListResult> {
  const products: Product[] = []
  const ingredients: Ingredient[] = []
  const urls: Record<string, string> = {}

  let url: string | null = startUrl
  let pageNum = 1
  const MAX_PAGES = 60

  while (url && pageNum <= MAX_PAGES) {
    await safeGoto(page, url)
    const html = await page.content()
    if (pageNum === 1) dumpHtml(html, `list_${label}`)
    const parsed = parseBrandPage(html)
    const pageUrls = extractDetailUrls(html)
    products.push(...parsed.products)
    ingredients.push(...parsed.ingredients)
    Object.assign(urls, pageUrls)

    // Find the next-page link. napsgear pagination uses standard pager
    // markup; cover several common selectors.
    url = await page.evaluate(() => {
      const sel = [
        '.pagination li.pages-item-next a',
        '.pages .pages-item-next a',
        'a[rel="next"]',
        '.pagination a.next',
        '.toolbar-bottom .next',
      ].join(', ')
      const a = document.querySelector<HTMLAnchorElement>(sel)
      return a?.href ?? null
    })
    pageNum++
  }

  return { products, ingredients, urls }
}

// ── Detail-page enrichment ───────────────────────────────────────────────────

async function scrapeDetail(page: Page, url: string): Promise<DetailPageResult | null> {
  try {
    await safeGoto(page, url)
    const html = await page.content()
    return parseDetailPage(html)
  } catch (err) {
    console.warn(`   ⚠️  detail failed: ${url} — ${(err as Error).message}`)
    return null
  }
}

// ── Merge helpers ────────────────────────────────────────────────────────────

function dedupBySlug(products: Product[]): Product[] {
  const seen = new Set<string>()
  const out: Product[] = []
  for (const p of products) {
    if (!p.slug || seen.has(p.slug)) continue
    seen.add(p.slug)
    out.push(p)
  }
  return out
}

function dedupIngredients(items: Ingredient[]): Ingredient[] {
  const seen = new Set<string>()
  const out: Ingredient[] = []
  for (const i of items) {
    const key = `${i.brand}::${i.id}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push(i)
  }
  return out
}

// ── Main ─────────────────────────────────────────────────────────────────────

;(async () => {
  console.log('🚀  NapsGear source scraper')
  console.log('   A Chromium window will open. If a Cloudflare challenge appears,')
  console.log('   click it manually — the clearance is persisted to')
  console.log(`   ${PROFILE_DIR}`)
  console.log(`   HTML dumps → ${DUMP_DIR}\n`)

  const ctx: BrowserContext = await chromium.launchPersistentContext(PROFILE_DIR, {
    headless: false,
    viewport: { width: 1280, height: 900 },
    locale: 'en-US',
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    extraHTTPHeaders: { 'Accept-Language': 'en-US,en;q=0.9' },
    args: ['--disable-blink-features=AutomationControlled', '--no-sandbox'],
  })
  // tsx/esbuild rewrites our injected functions to use `__name(fn, "name")`
  // (a `keepNames` helper that's defined in the bundle, NOT in the browser
  // page). Without a stub, our addInitScript + page.evaluate code throws
  // `ReferenceError: __name is not defined` inside the page — including
  // inside Cloudflare's challenge iframe, which then can never resolve.
  // Inject a no-op stub on every new document/frame before anything else.
  await ctx.addInitScript({
    content: `globalThis.__name = globalThis.__name || ((fn) => fn);`,
  })
  // Hide the webdriver flag — pass as a string so tsx doesn't rewrite it.
  await ctx.addInitScript({
    content: `Object.defineProperty(navigator, 'webdriver', { get: () => false });`,
  })
  const page = ctx.pages()[0] ?? (await ctx.newPage())

  try {
    // 1) Discover list pages
    console.log('🧭  Discovering brand + category list pages …')
    const listUrls = await getListPageUrls(page)
    console.log(`   Found ${listUrls.length} list pages`)

    if (!listUrls.length) {
      console.warn('   No list pages found. Open the homepage dump to inspect:')
      console.warn(`     ${path.join(DUMP_DIR, 'homepage.html')}`)
    }

    // 2) Scrape each list page, paginated
    const allProducts: Product[] = []
    const allIngredients: Ingredient[] = []
    const detailUrls: Record<string, string> = {}

    for (const url of listUrls) {
      const label = url.replace(BASE_URL, '').replace(/[^\w]+/g, '_')
      console.log(`\n📦  List: ${url}`)
      const res = await scrapeListWithPagination(page, url, label)
      console.log(`   ${res.products.length} products, ${res.ingredients.length} ingredients`)
      allProducts.push(...res.products)
      allIngredients.push(...res.ingredients)
      Object.assign(detailUrls, res.urls)
    }

    // Fallback: catalog/ if nothing was discovered
    if (!allProducts.length) {
      console.log('\n📦  Fallback: /catalog/')
      const res = await scrapeListWithPagination(page, `${BASE_URL}/catalog/`, 'catalog')
      allProducts.push(...res.products)
      allIngredients.push(...res.ingredients)
      Object.assign(detailUrls, res.urls)
    }

    const products = dedupBySlug(allProducts)
    const ingredients = dedupIngredients(allIngredients)
    console.log(`\n📊  After dedup: ${products.length} products, ${ingredients.length} ingredients`)

    // 3) Enrich each product from its detail page
    console.log('\n🔎  Enriching detail pages …')
    const details: DetailPageResult[] = []
    let done = 0
    for (const product of products) {
      const url = detailUrls[product.slug]
      if (!url) {
        done++
        continue
      }
      const detail = await scrapeDetail(page, url)
      if (detail) details.push(detail)
      done++
      if (done % 10 === 0 || done === products.length) {
        console.log(`   ${done}/${products.length} detail pages done`)
      }
    }

    const enriched = applyDetails(products, details)

    // 4) Write outputs
    const prodPath = path.join(DATA_DIR, 'products.json')
    const ingPath = path.join(DATA_DIR, 'ingredients.json')
    fs.writeFileSync(prodPath, JSON.stringify(enriched, null, 2))
    fs.writeFileSync(ingPath, JSON.stringify(ingredients, null, 2))
    console.log(`\n✅  Wrote ${enriched.length} products → ${path.relative(ROOT, prodPath)}`)
    console.log(`✅  Wrote ${ingredients.length} ingredients → ${path.relative(ROOT, ingPath)}`)
  } finally {
    await ctx.close().catch(() => {})
    console.log('\n🏁  Done.')
    console.log(`   HTML dumps: ${DUMP_DIR}`)
    console.log('   Next: node scripts/download-images.js  (fetch images to public/images/products/)')
  }
})().catch((err) => {
  console.error('\n❌  Fatal:', err instanceof Error ? err.message : err)
  process.exit(1)
})
