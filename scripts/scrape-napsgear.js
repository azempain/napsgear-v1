#!/usr/bin/env node
// Run: node scripts/scrape-napsgear.js
// On first run it dumps HTML snapshots to /tmp/ for selector inspection.
// On second run (after selectors are confirmed) it writes the JSON files.

const { chromium } = require('playwright')
const fs = require('fs')
const path = require('path')
const os = require('os')

const DATA_DIR = path.join(__dirname, '../src/data')
const BASE_URL = 'https://www.napsgear.org'
const DUMP_DIR = path.join(os.tmpdir(), 'napsgear-dump')
fs.mkdirSync(DUMP_DIR, { recursive: true })

// ── Helpers ───────────────────────────────────────────────────────────────────

async function waitForCloudflare(page, timeout = 60000) {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    const title = await page.title().catch(() => '')
    if (!title.includes('Just a moment') && !title.includes('Checking your')) return
    await page.waitForTimeout(2000)
  }
  throw new Error('Cloudflare challenge did not clear within 60 s')
}

async function dumpHtml(page, name) {
  const html = await page.content()
  const file = path.join(DUMP_DIR, `${name}.html`)
  fs.writeFileSync(file, html)
  console.log(`   📄  HTML saved → ${file}`)
  return html
}

// ── Video scraper ─────────────────────────────────────────────────────────────

async function scrapeVideos(page) {
  console.log('\n📹  Scraping videos …')
  await page.goto(`${BASE_URL}/ask-an-ifbb-pro/`, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await waitForCloudflare(page)
  await page.waitForTimeout(3000)

  await dumpHtml(page, 'ask-an-ifbb-pro')

  const videos = await page.evaluate(() => {
    const results = []

    // napsgear uses .post elements for video cards
    const selectors = [
      '.post',
      '.video-item',
      '.media-item',
      'article',
      '.entry',
      '.ama-video',
      '.item',
    ]

    let cards = []
    for (const sel of selectors) {
      const found = [...document.querySelectorAll(sel)]
      if (found.length > 2) { cards = found; break }
    }

    for (const card of cards) {
      // Skip nav/footer noise
      if (card.closest('nav, footer, header')) continue

      // Thumbnail — bg-image style or <img>
      let thumbnail = ''
      const styleEl = card.querySelector('[style*="url("]')
      if (styleEl) {
        const m = styleEl.getAttribute('style')?.match(/url\(['"]?([^'")\s]+)['"]?\)/)
        if (m) thumbnail = m[1]
      }
      if (!thumbnail) {
        const img = card.querySelector('img')
        thumbnail = img?.getAttribute('data-src') || img?.src || ''
      }

      // Title — first non-empty link text or heading
      let title = ''
      const titleEl = card.querySelector('h1,h2,h3,h4,.post-title,.entry-title')
      if (titleEl) title = titleEl.textContent?.trim() || ''
      if (!title) {
        const a = card.querySelector('a[title]')
        title = a?.getAttribute('title') || a?.textContent?.trim() || ''
      }

      // Date
      const dateEl = card.querySelector('time,.post-date,.entry-date,.date,small')
      const date = dateEl?.getAttribute('datetime') || dateEl?.textContent?.trim() || ''

      // URL
      const linkEl = card.querySelector('a[href]')
      let url = linkEl?.getAttribute('href') || '/ask-an-ifbb-pro/'
      if (url && !url.startsWith('http') && !url.startsWith('/')) url = '/' + url

      const isPremiere = /premiere/i.test(card.className + ' ' + (card.textContent || ''))

      if (thumbnail || title) {
        results.push({ url, title, date, thumbnail, ...(isPremiere ? { isPremiere: true } : {}) })
      }
    }
    return results
  })

  console.log(`   Found ${videos.length} videos`)
  return videos
}

// ── Product scraper ───────────────────────────────────────────────────────────

async function scrapeProductList(page, url, label) {
  console.log(`\n📦  Scraping products: ${label} …`)
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await waitForCloudflare(page)
  await page.waitForTimeout(2000)

  await dumpHtml(page, label.replace(/\W+/g, '-').toLowerCase())

  return page.evaluate((baseUrl) => {
    const items = []
    const selectors = [
      '.product-item',
      '.product-card',
      '.catalog-grid-item',
      'li.item',
      '.product',
      '.product-info',
    ]

    let cards = []
    for (const sel of selectors) {
      const found = [...document.querySelectorAll(sel)]
      if (found.length > 0) { cards = [...cards, ...found] }
    }

    // Deduplicate
    cards = [...new Set(cards)]

    for (const card of cards) {
      if (card.closest('nav,footer,header,.sidebar')) continue

      const nameEl = card.querySelector('.product-name,.product-title,h2,h3,h4,.name')
      const name = nameEl?.textContent?.trim() || ''
      if (!name) continue

      const imgEl = card.querySelector('img')
      const img = imgEl?.getAttribute('data-src') || imgEl?.src || ''

      const linkEl = card.querySelector('a[href]')
      const href = linkEl?.getAttribute('href') || ''
      const slug = href
        .replace(/.*\/([^/?#]+)\/?(\?.*)?$/, '$1')
        .replace(/\.html$/, '')
        || name.toLowerCase().replace(/[^a-z0-9]+/g, '-')

      const descEl = card.querySelector('.short-description,.description,p')
      const description = descEl?.textContent?.trim() || ''

      const priceEl = card.querySelector('.price,.product-price,.regular-price')
      const price = priceEl?.textContent?.trim() || ''

      items.push({
        slug,
        name,
        description,
        price,
        images: img ? [img] : [],
        url: href.startsWith('http') ? href : (href ? baseUrl + href : ''),
      })
    }
    return items
  }, BASE_URL)
}

// ── Discover brand / category pages from nav ──────────────────────────────────

async function getNavUrls(page) {
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await waitForCloudflare(page)
  await page.waitForTimeout(2000)
  await dumpHtml(page, 'homepage')

  return page.evaluate((base) => {
    const links = []
    const seen = new Set()
    document.querySelectorAll('a[href]').forEach(a => {
      const href = a.getAttribute('href') || ''
      const text = a.textContent?.trim() || ''
      const full = href.startsWith('http') ? href : (href.startsWith('/') ? base + href : '')
      if (!full || !full.startsWith(base)) return
      if (seen.has(full)) return
      if (
        /\/brands?\//i.test(full) ||
        /\/categor/i.test(full) ||
        /\/catalog/i.test(full)
      ) {
        seen.add(full)
        links.push({ href: full, text })
      }
    })
    return links
  }, BASE_URL)
}

// ── Main ──────────────────────────────────────────────────────────────────────

;(async () => {
  console.log('🚀  napsgear.org scraper')
  console.log('   A browser window will open. Cloudflare challenge usually auto-clears.')
  console.log(`   HTML dumps → ${DUMP_DIR}\n`)

  const browser = await chromium.launch({
    headless: false,
    args: ['--disable-blink-features=AutomationControlled', '--no-sandbox'],
  })

  const ctx = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 900 },
    locale: 'en-US',
    extraHTTPHeaders: { 'Accept-Language': 'en-US,en;q=0.9' },
  })

  const page = await ctx.newPage()

  // Hide navigator.webdriver
  await ctx.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false })
  })

  try {
    // ── Videos ────────────────────────────────────────────────────────────────
    const videos = await scrapeVideos(page)

    if (videos.length) {
      const vidPath = path.join(DATA_DIR, 'videos.json')
      fs.writeFileSync(vidPath, JSON.stringify(videos, null, 2))
      console.log(`\n✅  Wrote ${videos.length} videos → src/data/videos.json`)
    } else {
      console.warn('\n⚠️   No videos found. Check HTML dump for correct selectors.')
      console.log(`   Open ${path.join(DUMP_DIR, 'ask-an-ifbb-pro.html')} in a browser to inspect.`)
    }

    // ── Products ──────────────────────────────────────────────────────────────
    const navUrls = await getNavUrls(page)
    console.log(`\n🔗  Nav links found: ${navUrls.length}`)
    navUrls.slice(0, 8).forEach(l => console.log(`   ${l.text} → ${l.href}`))

    const allProducts = []

    if (navUrls.length) {
      for (const link of navUrls.slice(0, 15)) {
        const items = await scrapeProductList(page, link.href, link.text || link.href)
        allProducts.push(...items)
      }
    }

    // Fallback: try /catalog/ directly
    if (!allProducts.length) {
      const items = await scrapeProductList(page, `${BASE_URL}/catalog/`, 'catalog')
      allProducts.push(...items)
    }

    // Deduplicate by slug
    const seen = new Set()
    const unique = allProducts.filter(p => {
      if (!p.name || seen.has(p.slug)) return false
      seen.add(p.slug)
      return true
    })

    if (unique.length) {
      const prodPath = path.join(DATA_DIR, 'products.json')
      fs.writeFileSync(prodPath, JSON.stringify(unique, null, 2))
      console.log(`\n✅  Wrote ${unique.length} products → src/data/products.json`)
    } else {
      console.warn('\n⚠️   No products found.')
      console.log(`   Open ${path.join(DUMP_DIR, 'homepage.html')} to see the nav structure.`)
    }

  } finally {
    await browser.close()
    console.log('\n🏁  Done.')
    console.log(`\n📁  HTML dumps saved to: ${DUMP_DIR}`)
    console.log('   If data is missing, open the dump files and check what selectors match.')
  }
})().catch(err => {
  console.error('\n❌  Fatal:', err.message)
  process.exit(1)
})
