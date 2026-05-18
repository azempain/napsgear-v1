// Pure parse/transform layer for saved napsgear pages.
// No filesystem / network here — the CLI wrapper does I/O.

import { load } from 'cheerio'
import type { Product, Ingredient, PackTier, Review, QAItem } from '@/data/types'
import { parsePrice } from './pricing'

export interface BrandPageResult {
  brand: string
  products: Product[]
  ingredients: Ingredient[]
}

export function parseBrandPage(html: string): BrandPageResult {
  const $ = load(html)
  const brand = $('.category-title').first().text().trim()

  const products: Product[] = []
  $('.product-item').each((_, el) => {
    const card = $(el)
    const titleA = card.find('.product-item__title a').first()
    const name = titleA.text().trim()
    const href = titleA.attr('href') ?? ''
    if (!name || !href) return
    const slug = slugFromUrl(href)

    const images: string[] = []
    card.find('.product-item__image img').each((_, img) => {
      const src = $(img).attr('src') ?? ''
      if (src) images.push(localizeImage(src))
    })

    const labels: { new?: boolean; sale?: string } = {}
    if (card.find('.product-label.label-new').length) labels.new = true
    const saleTxt = card.find('.product-label.label-sale').first().text().trim()
    if (saleTxt) labels.sale = saleTxt

    products.push({
      slug,
      name,
      description: '',
      images,
      price: card.find('.product-price').first().text().trim() || undefined,
      brand: card.find('.product-item__manufacturer').first().text().trim() || brand,
      ...(Object.keys(labels).length ? { labels } : {}),
    })
  })

  const ingredients: Ingredient[] = []
  $('#ingredient_list .filter__item').each((_, el) => {
    const li = $(el)
    const link = li.find('.filter__link').first()
    const id = Number(link.attr('data-id'))
    const nm = li.find('.filter-name').first().text().trim()
    const count = Number(li.attr('data-count'))
    if (!Number.isFinite(id) || !nm) return
    ingredients.push({ id, name: nm, count: Number.isFinite(count) ? count : 0, brand })
  })

  return { brand, products, ingredients }
}

/** Last path segment of a product/detail URL, minus query/hash. */
export function slugFromUrl(url: string): string {
  const noHash = url.split('#')[0].split('?')[0]
  const path = noHash.replace(/^https?:\/\/[^/]+/, '').replace(/\/+$/, '')
  const seg = path.split('/').filter(Boolean).pop() ?? ''
  return seg
}

/** Any image reference → /images/products/<basename>. */
export function localizeImage(src: string): string {
  if (src.startsWith('/images/products/')) return src
  const clean = src.split('#')[0].split('?')[0]
  const base = clean.split('/').pop() ?? ''
  return `/images/products/${base}`
}

export interface DetailPageResult {
  slug: string
  description: string
  ingredient?: string
  packs?: PackTier[]
  reviews?: Review[]
  qa?: QAItem[]
}

function firstNumber(s: string): number | undefined {
  const m = s.replace(/,/g, '').match(/\d+/)
  return m ? Number(m[0]) : undefined
}

export function parseDetailPage(html: string): DetailPageResult {
  const $ = load(html)

  const isProductHref = (h: string) => /-p\d+(?:\/|$|[?#])/.test(h)
  let href = ''
  $('a[href]').each((_, a) => {
    if (href) return
    const h = $(a).attr('href') ?? ''
    if (isProductHref(h)) href = h
  })
  const slug = slugFromUrl(href)

  let ingredient: string | undefined
  $('.product-single-specifications li').each((_, li) => {
    const label = $(li).find('.label').text().toLowerCase()
    if (label.includes('pharmaceutical')) {
      ingredient = $(li).clone().children('.label').remove().end().text().trim() || undefined
    }
  })

  const blocks: string[] = []
  $('#description > div').each((_, d) => {
    const t = $(d).text().replace(/ /g, ' ').trim()
    if (t) blocks.push(t)
  })
  const description = blocks.join('\n')

  const packs: PackTier[] = []
  $('.product-multipliers__item').each((_, it) => {
    const item = $(it)
    const qty = item.find('.quantity').text().trim().replace(/\s+/g, ' ')
    const packsN = firstNumber(qty) ?? 0
    const labelMatch = qty.match(/\(([\s\S]+)\)\s*$/)
    const label = labelMatch ? labelMatch[1].trim() : undefined
    const perItem = parsePrice(item.find('.price-per-item').text())
    const total = parsePrice(item.find('.price-total').text())
    packs.push({ packs: packsN, ...(label ? { label } : {}), perItem, total })
  })

  const result: DetailPageResult = { slug, description }
  if (ingredient) result.ingredient = ingredient
  if (packs.length) result.packs = packs
  const reviews = parseReviews(html)
  const qa = parseQA(html)
  if (reviews.length) result.reviews = reviews
  if (qa.length) result.qa = qa
  return result
}

const sameBrand = (a?: string, b?: string) =>
  (a ?? '').trim().toLowerCase() === (b ?? '').trim().toLowerCase()

export function mergeProducts(existing: Product[], brand: string, fresh: Product[]): Product[] {
  return [...existing.filter(p => !sameBrand(p.brand, brand)), ...fresh]
}

export function mergeIngredients(existing: Ingredient[], brand: string, fresh: Ingredient[]): Ingredient[] {
  return [...existing.filter(i => !sameBrand(i.brand, brand)), ...fresh]
}

export function applyDetails(products: Product[], details: DetailPageResult[]): Product[] {
  const bySlug = new Map(details.map(d => [d.slug, d]))
  return products.map(p => {
    const d = bySlug.get(p.slug)
    if (!d) return p
    return {
      ...p,
      description: d.description || p.description,
      ...(d.ingredient ? { ingredient: d.ingredient } : {}),
      ...(d.packs ? { packs: d.packs } : {}),
      ...(d.reviews ? { reviews: d.reviews } : {}),
      ...(d.qa ? { qa: d.qa } : {}),
    }
  })
}

export function parseReviews(html: string): Review[] {
  const $ = load(html)
  const out: Review[] = []
  $('.product-review__item').each((_, el) => {
    const it = $(el)
    const titleAttr = it.find('.rating-stars').first().attr('title')
    let rating = Number(titleAttr)
    if (!Number.isFinite(rating)) rating = it.find('.rating-stars-icon.active').length
    rating = Math.max(0, Math.min(5, Math.round(rating)))
    const author = it.find('.post-author h4').first().text().replace(/^\s*by\s+/i, '').trim()
    const date = it.find('.post-date').first().text().replace(/^\s*date added:\s*/i, '').trim()
    const body = it.find('.product-review__item-body').first().text().trim()
    if (!body && rating === 0) return
    out.push({ rating, author, date, body })
  })
  return out
}

export function parseQA(html: string): QAItem[] {
  const $ = load(html)
  const out: QAItem[] = []
  $('.product-customer-post').each((_, el) => {
    const it = $(el)
    const author = it.find('.post-author h4').first().text().trim()
    const date = it.find('.post-date').first().text().replace(/^\s*asked:\s*/i, '').trim()
    const question = it.find('.question-body .text-body').first().text().trim()
    if (!question) return
    out.push({ author, date, question })
  })
  return out
}
