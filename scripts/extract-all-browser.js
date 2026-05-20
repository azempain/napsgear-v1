// Paste this in DevTools console on any napsgear.org page (your Edge session
// is already past Cloudflare, so same-origin fetch() works).
//
// What it does
//   1. Crawls every brand listing page (paginated), collecting product cards.
//   2. Visits each unique product detail page, parsing description, brand,
//      ingredient, packs, labels, reviews, Q&A.
//   3. Downloads products.json + ingredients.json matching src/data/types.ts.
//
// Robustness
//   - Resumes from where the previous run stopped. Progress is saved to
//     localStorage['naps_progress'] every 10 detail pages. Re-paste to resume.
//   - On HTTP 403 (Cloudflare rate-limit), backs off 30s/60s/120s then retries.
//   - Slow pacing (1s per detail page) keeps under the rate-limit threshold.
//
// To reset and start over:   localStorage.removeItem('naps_progress')
// To abort mid-run:           window.__napsAbort = true

;(async () => {
  const BASE = 'https://www.napsgear.org'
  const STATE_KEY = 'naps_progress'
  const LIST_DELAY = 200      // ms between list-page fetches
  const DETAIL_DELAY = 1000   // ms between detail-page fetches (rate-limit headroom)

  // Full brand + category slug list. Copied from src/data/brands.json after
  // filtering for the canonical /-c<id>$/ shape. Edit if napsgear adds brands.
  const SEED_SLUGS = [
    'alpha-pharma-healthcare-c141952', 'accordo-rx-c144205', 'alp-laboratories-c146773',
    'aurum-pharmaceuticals-c142339', 'avogen-lab-c135271', 'beligas-c142048',
    'biomex-labs-c142714', 'biotech-labs-c147750', 'bull-pharma-c146770',
    'crowx-labs-c146386', 'euro-pharmacies-c142195', 'geneza-pharmaceuticals-c142291',
    'genshi-labs-c145954', 'nakon-medical-c145333', 'omega-lab-c147558',
    'pharmaqo-labs-c142576', 'ryzen-pharmaceuticals-c146674', 'sixpex-c145330',
    'tsg-compound-pharmacy-c142099', 'ultima-pharmaceuticals-c144304',
    'xeno-labs-c142528', 'xt-labs-c141388', 'ed-pills-c141856',
    'hcg-miscellaneous-c141239', 'human-growth-hormone-c138076', 'turkish-pharma-c147846',
    'crowx-labs-c146915', 'euro-pharmacies-c145429', 'sixpex-c147218',
    'odin-pharma-c147702', 'nano-peptides-c147606', 'pharmaqo-labs-c145435',
    'u-s-made-peptides-c141194', 'tsg-compound-pharmacy-c147507',
    'ultima-pharmaceuticals-c145432', 'xeno-labs-c147029', 'xt-labs-c146146',
    'euro-pharmacies-europe-c146578', 'pharmaqo-labs-c145624', 'xt-labs-c146149',
    'us-domestic-c147753', 'maxtreme-pharma-c145523', 'deus-medical-europe-c146933',
    'bioteq-labs-europe-c147902', 'dragon-pharma-c146050', 'generic-asia-c147840',
    'bm-pharmaceuticals-c147848', 'magnum-pharma-c147850',
    'other-pharmacy-steroid-brands-c147845', 'india-pharmacy-steroids-c147843',
    'insulins-amp-biguanides-c43', 'human-growth-hormone-c45',
    'syringes-needles-c879', 'peptides-c147555', 'sarms-c148012',
    'singapore-pharmacies-c147841', 'herbals-c147844',
  ]

  // Also discover any brand links visible on the current page (mega-menu)
  const discovered = new Set(SEED_SLUGS)
  document.querySelectorAll('a[href*="/brands/"], a[href*="/categories/"]').forEach(a => {
    const m = a.getAttribute('href')?.match(/\/(?:brands|categories)\/([a-z0-9-]+-c\d+)/i)
    if (m) discovered.add(m[1])
  })
  const brandSlugs = [...discovered]
  console.log(`%c🧭  ${brandSlugs.length} brand/category pages queued`, 'color:#0089cb;font-weight:bold')

  // ── helpers ───────────────────────────────────────────────────────────────

  const sleep = ms => new Promise(r => setTimeout(r, ms))

  async function getHtml(url, attempt = 1) {
    if (window.__napsAbort) throw new Error('aborted by user')
    try {
      const res = await fetch(url, { credentials: 'include' })
      if (res.status === 403 || res.status === 429) {
        // Rate-limited — back off and retry
        if (attempt <= 3) {
          const wait = [30, 60, 120][attempt - 1] * 1000
          console.warn(`   ⏳  ${res.status} on ${url} — backing off ${wait / 1000}s`)
          await sleep(wait)
          return getHtml(url, attempt + 1)
        }
        throw new Error(`HTTP ${res.status} after backoff`)
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.text()
    } catch (e) {
      if (attempt <= 2 && !/HTTP/.test(e.message)) {
        await sleep(500 * attempt)
        return getHtml(url, attempt + 1)
      }
      throw e
    }
  }

  function parseDoc(html) { return new DOMParser().parseFromString(html, 'text/html') }
  function slugFromUrl(url) {
    const noHash = url.split('#')[0].split('?')[0]
    const p = noHash.replace(/^https?:\/\/[^/]+/, '').replace(/\/+$/, '')
    return p.split('/').filter(Boolean).pop() || ''
  }
  function localizeImage(src) {
    if (!src) return ''
    if (src.startsWith('/images/products/')) return src
    const clean = src.split('#')[0].split('?')[0]
    return `/images/products/${clean.split('/').pop() || ''}`
  }
  function firstNumber(s) {
    const m = (s || '').replace(/,/g, '').match(/\d+/)
    return m ? Number(m[0]) : undefined
  }
  function parsePrice(s) {
    if (!s) return 0
    const m = String(s).replace(/[^0-9.]/g, '').match(/[\d.]+/)
    return m ? Number(m[0]) : 0
  }
  function decodeEntities(s) {
    return (s || '')
      .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
      .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
      .replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&apos;/g, "'")
      .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
      .trim()
  }

  // ── parsers ───────────────────────────────────────────────────────────────

  function parseListPage(doc) {
    const brand = doc.querySelector('.category-title')?.textContent?.trim() || ''
    const products = []
    const detailUrls = {}
    doc.querySelectorAll('.product-item').forEach(el => {
      const a = el.querySelector('.product-item__title a')
      const name = a?.textContent?.trim() || ''
      const href = a?.getAttribute('href') || ''
      if (!name || !href) return
      const slug = slugFromUrl(href)
      const full = href.startsWith('http')
        ? href
        : (href.startsWith('/') ? BASE + href : BASE + '/' + href)
      detailUrls[slug] = full
      const images = []
      el.querySelectorAll('.product-item__image img').forEach(img => {
        const src = img.getAttribute('data-src') || img.getAttribute('src') || ''
        if (src) images.push(localizeImage(src))
      })
      const labels = {}
      if (el.querySelector('.product-label.label-new')) labels.new = true
      const sale = el.querySelector('.product-label.label-sale')?.textContent?.trim()
      if (sale) labels.sale = sale
      products.push({
        slug, name, description: '',
        images,
        price: el.querySelector('.product-price')?.textContent?.trim() || undefined,
        brand: el.querySelector('.product-item__manufacturer')?.textContent?.trim() || brand,
        ...(Object.keys(labels).length ? { labels } : {}),
      })
    })
    const ingredients = []
    doc.querySelectorAll('#ingredient_list .filter__item').forEach(li => {
      const link = li.querySelector('.filter__link')
      const id = Number(link?.getAttribute('data-id'))
      const name = li.querySelector('.filter-name')?.textContent?.trim() || ''
      const count = Number(li.getAttribute('data-count'))
      if (!Number.isFinite(id) || !name) return
      ingredients.push({ id, name, count: Number.isFinite(count) ? count : 0, brand })
    })
    const next = doc.querySelector('.pagination li.pages-item-next a, .pages .pages-item-next a, a[rel="next"], .pagination a.next')
    const nextHref = next?.getAttribute('href') || null
    const nextUrl = nextHref ? (nextHref.startsWith('http') ? nextHref : BASE + nextHref) : null
    return { products, ingredients, detailUrls, nextUrl, brand }
  }

  function parseDetail(doc) {
    let ingredient
    doc.querySelectorAll('.product-single-specifications li').forEach(li => {
      const label = li.querySelector('.label')?.textContent?.toLowerCase() || ''
      if (label.includes('pharmaceutical')) {
        const clone = li.cloneNode(true)
        clone.querySelectorAll('.label').forEach(n => n.remove())
        const t = clone.textContent.trim()
        if (t) ingredient = t
      }
    })
    const description = [...doc.querySelectorAll('#description > div')]
      .map(d => d.textContent.replace(/ /g, ' ').trim())
      .filter(Boolean).join('\n')
    const packs = []
    doc.querySelectorAll('.product-multipliers__item').forEach(it => {
      const qty = (it.querySelector('.quantity')?.textContent || '').trim().replace(/\s+/g, ' ')
      const packsN = firstNumber(qty) ?? 0
      const lm = qty.match(/\(([\s\S]+)\)\s*$/)
      const label = lm ? lm[1].trim() : undefined
      const perItem = parsePrice(it.querySelector('.price-per-item')?.textContent)
      const total = parsePrice(it.querySelector('.price-total')?.textContent)
      packs.push({ packs: packsN, ...(label ? { label } : {}), perItem, total })
    })
    const reviews = []
    doc.querySelectorAll('.product-review__item').forEach(it => {
      const titleAttr = it.querySelector('.rating-stars')?.getAttribute('title')
      let rating = Number(titleAttr)
      if (!Number.isFinite(rating)) rating = it.querySelectorAll('.rating-stars-icon.active').length
      rating = Math.max(0, Math.min(5, Math.round(rating)))
      const author = (it.querySelector('.post-author h4')?.textContent || '').replace(/^\s*by\s+/i, '').trim()
      const date = (it.querySelector('.post-date')?.textContent || '').replace(/^\s*date added:\s*/i, '').trim()
      const body = decodeEntities(it.querySelector('.product-review__item-body')?.textContent || '')
      if (!body && rating === 0) return
      reviews.push({ rating, author, date, body })
    })
    const qa = []
    doc.querySelectorAll('.product-customer-post').forEach(it => {
      const author = (it.querySelector('.post-author h4')?.textContent || '').trim()
      const date = (it.querySelector('.post-date')?.textContent || '').replace(/^\s*asked:\s*/i, '').trim()
      const question = decodeEntities(it.querySelector('.question-body .text-body')?.textContent || '')
      if (!question) return
      qa.push({ author, date, question })
    })
    const out = { description }
    if (ingredient) out.ingredient = ingredient
    if (packs.length) out.packs = packs
    if (reviews.length) out.reviews = reviews
    if (qa.length) out.qa = qa
    return out
  }

  // ── load / save progress ──────────────────────────────────────────────────

  function loadState() {
    try {
      const s = JSON.parse(localStorage.getItem(STATE_KEY) || 'null')
      if (s && s.products && s.detailUrls && s.ingredients) {
        console.log(`%c↻  Resuming: ${Object.keys(s.products).length} products, ${Object.keys(s.enriched || {}).length} already enriched`, 'color:#a07c00')
        return s
      }
    } catch {}
    return { products: {}, detailUrls: {}, ingredients: [], enriched: {}, listsDone: [] }
  }
  function saveState(s) {
    try { localStorage.setItem(STATE_KEY, JSON.stringify(s)) } catch {}
  }

  const state = loadState()

  // ── 1) crawl list pages ───────────────────────────────────────────────────

  let i = 0
  for (const slug of brandSlugs) {
    i++
    if (window.__napsAbort) { console.warn('Aborted.'); break }
    if (state.listsDone.includes(slug)) { continue }
    let url = `${BASE}/brands/${slug}/`
    let pageNum = 0
    let total = 0
    let triedAlt = false
    while (url && pageNum < 60) {
      try {
        const html = await getHtml(url)
        const doc = parseDoc(html)
        const res = parseListPage(doc)
        for (const p of res.products) state.products[p.slug] = p
        for (const ing of res.ingredients) state.ingredients.push(ing)
        Object.assign(state.detailUrls, res.detailUrls)
        total += res.products.length
        if (!res.nextUrl) break
        url = res.nextUrl
        pageNum++
        await sleep(LIST_DELAY)
      } catch (e) {
        if (!triedAlt && pageNum === 0) {
          triedAlt = true
          url = `${BASE}/categories/${slug}/`
          continue
        }
        console.warn(`   list err ${url}: ${e.message}`)
        break
      }
    }
    state.listsDone.push(slug)
    saveState(state)
    console.log(`[${i}/${brandSlugs.length}] ${slug}: ${total} products  (unique: ${Object.keys(state.products).length})`)
    await sleep(LIST_DELAY)
  }

  // ── 2) enrich detail pages ────────────────────────────────────────────────

  const allSlugs = Object.keys(state.products)
  const remaining = allSlugs.filter(s => !state.enriched[s])
  console.log(`%c🔎  ${allSlugs.length} products total. ${remaining.length} detail pages to fetch.`, 'color:#0089cb;font-weight:bold')

  let done = 0
  for (const slug of remaining) {
    done++
    if (window.__napsAbort) { console.warn('Aborted — re-paste to resume.'); break }
    const url = state.detailUrls[slug]
    if (!url) { state.enriched[slug] = true; continue }
    try {
      const html = await getHtml(url)
      const doc = parseDoc(html)
      const d = parseDetail(doc)
      const p = state.products[slug]
      state.products[slug] = {
        ...p,
        description: d.description || p.description,
        ...(d.ingredient ? { ingredient: d.ingredient } : {}),
        ...(d.packs ? { packs: d.packs } : {}),
        ...(d.reviews ? { reviews: d.reviews } : {}),
        ...(d.qa ? { qa: d.qa } : {}),
      }
      state.enriched[slug] = true
    } catch (e) {
      console.warn(`   detail err ${url}: ${e.message}`)
      // Don't mark enriched on failure so a re-run retries it.
    }
    if (done % 10 === 0 || done === remaining.length) {
      saveState(state)
      console.log(`   ${done}/${remaining.length} (${Object.keys(state.enriched).length}/${allSlugs.length} total)`)
    }
    await sleep(DETAIL_DELAY)
  }
  saveState(state)

  // ── 3) finalize & download ────────────────────────────────────────────────

  const productsJson = Object.values(state.products)
  const ingSeen = new Set()
  const ingredientsUniq = []
  for (const it of state.ingredients) {
    const key = `${it.brand}::${it.id}`
    if (ingSeen.has(key)) continue
    ingSeen.add(key)
    ingredientsUniq.push(it)
  }
  function download(name, obj) {
    const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = name
    a.click()
  }
  download('products.json', productsJson)
  await sleep(250)
  download('ingredients.json', ingredientsUniq)

  console.log(`%c✅  ${productsJson.length} products, ${ingredientsUniq.length} ingredients`, 'color:#16a34a;font-weight:bold')
  const stillToEnrich = allSlugs.length - Object.keys(state.enriched).length
  if (stillToEnrich > 0) {
    console.warn(`%c⚠  ${stillToEnrich} products still need detail-page enrichment. Re-paste this script later to continue (progress saved).`, 'color:#a07c00')
  } else {
    console.log('   All detail pages done. Move files into src/data/ and run: node scripts/download-images.js')
  }
})()
