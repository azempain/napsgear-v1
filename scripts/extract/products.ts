// Pure HTML → Product parsing. Selectors match the actual saved PDP +
// brand-listing HTML structure (confirmed via grep before implementation).
// The file shell in runProducts() (Task 6) handles I/O + image copying.

import { loadHtml } from './lib/loadHtml'
import type { Product, PackTier, Review } from '@/data/types'

/** Strip a trailing slug+id from a product URL.
 *  "https://www.napsgear.org/altamofen-...-p7900" → "altamofen-...-p7900" */
function slugFromHref(href: string | undefined): string {
  if (!href) return ''
  // Drop query/hash, drop trailing slash, then take last path segment
  const noQuery = href.split('?')[0].split('#')[0]
  return noQuery.replace(/^https?:\/\/[^/]+/, '').replace(/^\/+|\/+$/g, '').split('/').pop() ?? ''
}

/** "1 pack  (50 tabs (20mg/tab))" → { packs: 1, label: "50 tabs (20mg/tab)" } */
function parseQuantity(text: string): { packs: number; label?: string } {
  const trimmed = text.trim()
  const packsMatch = trimmed.match(/^(\d+)\s+packs?/i)
  if (!packsMatch) return { packs: 0 }
  const packs = Number(packsMatch[1])
  // First open paren starts the label, last matching close paren ends it
  const openIdx = trimmed.indexOf('(')
  if (openIdx === -1) return { packs }
  const lastClose = trimmed.lastIndexOf(')')
  if (lastClose <= openIdx) return { packs }
  const label = trimmed.slice(openIdx + 1, lastClose).trim()
  return { packs, label: label || undefined }
}

/** "$30" / "$28.6" / "$28.59" → numeric. Strips $, commas, whitespace. */
function parseDollar(text: string | undefined): number {
  if (!text) return 0
  const n = parseFloat(text.replace(/[^0-9.]/g, ''))
  return Number.isFinite(n) ? n : 0
}

/** Find the `<li>` whose `.label` text matches a given prefix (e.g. "Manufacturer")
 *  and return the trimmed text after the colon. */
function specValue($: ReturnType<typeof loadHtml>, label: string): string | undefined {
  let value: string | undefined
  $('ul.product-single-specifications li').each((_, li) => {
    if (value) return
    const $li = $(li)
    const labelText = $li.find('span.label').first().text().trim()
    if (labelText.toLowerCase().startsWith(label.toLowerCase())) {
      const full = $li.text().trim()
      // Strip the leading "Label:" prefix
      const colon = full.indexOf(':')
      value = colon >= 0 ? full.slice(colon + 1).trim() : full
    }
  })
  return value
}

export function extractPdp(html: string): Product {
  const $ = loadHtml(html)

  const name = $('h1.product-title').first().text().trim()
  if (!name) throw new Error('extractPdp: missing h1.product-title')

  const brand = specValue($, 'Manufacturer')
  const ingredient = specValue($, 'Pharmaceutical name')

  const images: string[] = []
  $('.product-single-image img').each((_, img) => {
    const src = $(img).attr('src')
    if (src) images.push(src)
  })

  // Description: collect text from each direct <div> inside #description (or
  // the active tab pane). Skip empties / nbsp-only blocks; join paragraphs
  // with a blank-line separator so the renderer's whiteSpace: pre-line picks
  // them up as paragraph breaks.
  const descParas: string[] = []
  $('#description > div, .tab-pane.active#description > div').each((_, d) => {
    const txt = $(d).text().replace(/\s+/g, ' ').trim()
    if (txt && txt !== ' ') descParas.push(txt)
  })
  const description = descParas.join('\n\n')

  const packs: PackTier[] = []
  $('.product-multipliers__item').each((_, item) => {
    const $item = $(item)
    const qty = parseQuantity($item.find('.quantity').first().text())
    if (!qty.packs) return
    const perItem = parseDollar($item.find('.price-per-item').first().text())
    const total = parseDollar($item.find('.price-total').first().text())
    const tier: PackTier = { packs: qty.packs, perItem, total }
    if (qty.label) tier.label = qty.label
    packs.push(tier)
  })

  const reviews: Review[] = []
  $('.product-review__item').each((_, r) => {
    const $r = $(r)
    const ratingTitle = $r.find('.rating-stars').first().attr('title') ?? '0'
    const rating = Number(ratingTitle) || 0
    const body = $r.find('.product-review__item-body').first().text().replace(/\s+/g, ' ').trim()
    // Author rendered as "by Alpha" — strip the "by " prefix when present
    const authorRaw = $r.find('.post-author').first().text().trim()
    const author = authorRaw.replace(/^by\s+/i, '')
    // Date often empty in this corpus; capture if present
    const date = $r.find('time, .post-date').first().text().trim()
    if (body) reviews.push({ rating, author, date, body })
  })

  // Slug: prefer the canonical link, fall back to a slugified product name
  const canonical = $('link[rel="canonical"]').attr('href')
  const slug = canonical
    ? slugFromHref(canonical)
    : name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

  return {
    slug,
    name,
    description,
    images,
    ...(brand ? { brand } : {}),
    ...(ingredient ? { ingredient } : {}),
    ...(packs.length ? { packs } : {}),
    ...(reviews.length ? { reviews } : {}),
  }
}

// ─── Listing parser ─────────────────────────────────────────────────────────

/** Returns one summary Product per card in a brand or category listing page. */
export function extractListingProducts(html: string): Product[] {
  const $ = loadHtml(html)
  const out: Product[] = []

  $('.product-item').each((_, item) => {
    const $item = $(item)
    const titleAnchor = $item.find('h3.product-item__title a, .product-item__title a').first()
    const href = titleAnchor.attr('href') ?? $item.find('a.product-item__image').first().attr('href')
    const slug = slugFromHref(href)
    if (!slug) return

    const name = titleAnchor.text().trim()
    const brand = $item.find('.product-item__manufacturer').first().text().trim() || undefined
    const price = $item.find('.price-box .product-price').first().text().trim() || undefined

    const thumbSrc = $item.find('a.product-item__image img, .product-item__image img').first().attr('src')
    const images = thumbSrc ? [thumbSrc] : []

    out.push({
      slug,
      name,
      description: '',
      images,
      ...(brand ? { brand } : {}),
      ...(price ? { price } : {}),
    })
  })

  return out
}

// ─── Shell (filesystem + image copy + merge) ───────────────────────────────

import { promises as fs } from 'node:fs'
import path from 'node:path'
import { loadHtmlFromFile } from './lib/loadHtml'
import { mergeBySlug } from './lib/mergeBySlug'
import { copyAsset } from './lib/copyAsset'

const SAVED_DIR  = 'saved pages'
const PUBLIC_DIR = 'public/images/products'
const DATA_FILE  = 'src/data/products.json'

const PDP_FILES = [
  'NapsGear  -  ALPHA-PHARMA HEALTHCARE PAGE - Details Page.html',
]
const LISTING_FILES = [
  'NapsGear  -  ALPHA-PHARMA HEALTHCARE PAGE.html',
  'NapsGear - Alpha-Pharma Healthcare.html',
  'NapsGear - AvoGen Lab.html',
  'NapsGear - Oral steroids.html',
]

async function resolveSavedAssetPath(htmlFile: string, src: string): Promise<string | null> {
  // Saved-page _files/ images use relative paths like
  // "./NapsGear  -  ALPHA-PHARMA HEALTHCARE PAGE_files/alpha-pharma-altamofen.jpg".
  // Resolve against the saved-page parent dir and verify the file exists.
  const baseDir = path.dirname(path.resolve(SAVED_DIR, htmlFile))
  const cleaned = src.replace(/^\.?\/+/, '')
  const candidate = path.resolve(baseDir, cleaned)
  try {
    await fs.stat(candidate)
    return candidate
  } catch {
    return null
  }
}

async function relocateImages(
  p: Product,
  sourceHtmlFile: string,
): Promise<{ images: string[]; copied: number }> {
  const out: string[] = []
  let copied = 0
  for (const src of p.images) {
    // If src already points at a deployed asset (/images/...), keep it
    if (src.startsWith('/images/')) {
      out.push(src)
      continue
    }
    const absSrc = await resolveSavedAssetPath(sourceHtmlFile, src)
    if (!absSrc) {
      // Source image missing — leave the path so the failure is visible
      out.push(src)
      continue
    }
    const ext = (path.extname(absSrc) || '.jpg').toLowerCase()
    const publicName = `${p.slug}${ext}`
    const dst = path.join(PUBLIC_DIR, publicName)
    const result = await copyAsset(absSrc, dst)
    if (result.copied) copied++
    out.push(`/images/products/${publicName}`)
  }
  return { images: out, copied }
}

export interface ProductsSummary {
  added: number
  updated: number
  unchanged: number
  copiedImages: number
}

export async function runProducts(): Promise<ProductsSummary> {
  let existing: Product[] = []
  try {
    existing = JSON.parse(await fs.readFile(DATA_FILE, 'utf8')) as Product[]
  } catch {
    existing = []
  }

  const incoming: Product[] = []
  let copiedImages = 0

  for (const f of PDP_FILES) {
    const $ = await loadHtmlFromFile(path.join(SAVED_DIR, f))
    const p = extractPdp($.html() ?? '')
    const r = await relocateImages(p, f)
    p.images = r.images
    copiedImages += r.copied
    incoming.push(p)
  }
  for (const f of LISTING_FILES) {
    const $ = await loadHtmlFromFile(path.join(SAVED_DIR, f))
    const rows = extractListingProducts($.html() ?? '')
    for (const p of rows) {
      const r = await relocateImages(p, f)
      p.images = r.images
      copiedImages += r.copied
      incoming.push(p)
    }
  }

  const result = mergeBySlug(existing, incoming)
  await fs.writeFile(DATA_FILE, JSON.stringify(result.merged, null, 2) + '\n', 'utf8')

  return {
    added: result.added,
    updated: result.updated,
    unchanged: result.unchanged,
    copiedImages,
  }
}
