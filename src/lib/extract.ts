// Pure parse/transform layer for saved napsgear pages.
// No filesystem / network here — the CLI wrapper does I/O.

import { load } from 'cheerio'
import type { Product, Ingredient } from '@/data/types'

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
