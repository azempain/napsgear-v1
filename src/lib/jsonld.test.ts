import { describe, it, expect } from 'vitest'
import type { Product } from '@/data/types'
import {
  organizationJsonLd, websiteJsonLd, breadcrumbJsonLd, productJsonLd,
} from './jsonld'
import { SITE_URL, SITE_NAME } from './site'

const baseProduct: Product = {
  slug: 'altamofen-20mg',
  name: 'Altamofen 20mg',
  description: 'Tamoxifen 20mg per tab',
  images: ['/images/products/altamofen.jpg'],
  price: '$30',
  brand: 'Alpha-Pharma Healthcare',
  ingredient: 'Tamoxifen',
}

describe('organizationJsonLd', () => {
  const o = organizationJsonLd()
  it('has @context schema.org and @type Organization', () => {
    expect(o['@context']).toBe('https://schema.org')
    expect(o['@type']).toBe('Organization')
  })
  it('uses SITE_NAME and SITE_URL', () => {
    expect(o.name).toBe(SITE_NAME)
    expect(o.url).toBe(SITE_URL)
  })
  it('logo is absolute', () => {
    expect((o.logo as string).startsWith('https://')).toBe(true)
  })
})

describe('websiteJsonLd', () => {
  const w = websiteJsonLd()
  it('declares a SearchAction pointing at /catalog/', () => {
    expect(w['@type']).toBe('WebSite')
    expect((w.potentialAction as { target: { urlTemplate: string } }).target.urlTemplate)
      .toContain('/catalog/?q=')
  })
})

describe('breadcrumbJsonLd', () => {
  it('numbers positions 1..N', () => {
    const b = breadcrumbJsonLd([
      { name: 'Home', href: '/' },
      { name: 'Catalog', href: '/catalog/' },
      { name: 'Product' },
    ])
    const items = b.itemListElement
    expect(items.length).toBe(3)
    expect(items[0].position).toBe(1)
    expect(items[1].position).toBe(2)
    expect(items[2].position).toBe(3)
  })
  it('final crumb has no item (current page)', () => {
    const b = breadcrumbJsonLd([
      { name: 'Home', href: '/' },
      { name: 'Now' },
    ])
    expect('item' in b.itemListElement[1]).toBe(false)
  })
  it('absolutises relative hrefs', () => {
    const b = breadcrumbJsonLd([{ name: 'Home', href: '/' }])
    expect(b.itemListElement[0].item).toBe(`${SITE_URL}/`)
  })
  it('passes absolute hrefs through unchanged', () => {
    const b = breadcrumbJsonLd([{ name: 'X', href: 'https://other.example/x' }])
    expect(b.itemListElement[0].item).toBe('https://other.example/x')
  })
})

describe('productJsonLd', () => {
  const p = productJsonLd(baseProduct)
  it('emits Product type with name, description, sku, url', () => {
    expect(p['@type']).toBe('Product')
    expect(p.name).toBe('Altamofen 20mg')
    expect(p.sku).toBe('altamofen-20mg')
    expect(p.url).toBe(`${SITE_URL}/altamofen-20mg/`)
  })
  it('absolutises image URLs', () => {
    expect(p.image).toEqual([`${SITE_URL}/images/products/altamofen.jpg`])
  })
  it('brand as nested Brand entity', () => {
    expect(p.brand).toEqual({ '@type': 'Brand', name: 'Alpha-Pharma Healthcare' })
  })
  it('emits additionalProperty for active ingredient', () => {
    expect(p.additionalProperty).toEqual({
      '@type': 'PropertyValue',
      name: 'Active Ingredient',
      value: 'Tamoxifen',
    })
  })
  it('emits AggregateOffer with low/high prices in USD', () => {
    const o = p.offers as { lowPrice: string; highPrice: string; priceCurrency: string; offerCount: number; availability: string }
    expect(o.priceCurrency).toBe('USD')
    expect(parseFloat(o.lowPrice)).toBeGreaterThan(0)
    expect(parseFloat(o.highPrice)).toBeGreaterThanOrEqual(parseFloat(o.lowPrice))
    expect(o.offerCount).toBe(5)
    expect(o.availability).toBe('https://schema.org/InStock')
  })
  it('omits offers when product has no usable price', () => {
    const noPrice = productJsonLd({ ...baseProduct, price: undefined, packs: [] })
    expect('offers' in noPrice).toBe(false)
  })
  it('emits AggregateRating when reviews are present', () => {
    const withReviews = productJsonLd({
      ...baseProduct,
      reviews: [
        { rating: 5, author: 'A', date: '2025-01-01', body: 'great' },
        { rating: 3, author: 'B', date: '2025-01-02', body: 'ok' },
      ],
    })
    const r = withReviews.aggregateRating as { ratingValue: string; reviewCount: number }
    expect(r.reviewCount).toBe(2)
    expect(parseFloat(r.ratingValue)).toBeCloseTo(4.0, 1)
  })
})
