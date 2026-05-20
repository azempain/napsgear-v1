// Pure builders for the schema.org JSON-LD blobs we embed on key routes.
// Each function returns a plain JS object that the <JsonLd> component
// serializes into a <script type="application/ld+json"> tag. No I/O, no
// React — all testable in Node.

import type { Product } from '@/data/types'
import { parsePrice, packTiers } from './pricing'
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION, absoluteUrl } from './site'

const CONTEXT = 'https://schema.org' as const

export interface Crumb {
  /** Display name shown to crawlers and rich results */
  name: string
  /** Absolute or absolute-path URL; omit on the final breadcrumb */
  href?: string
}

/** Organization JSON-LD for the root layout. Identifies the site to crawlers
 *  and is what Google uses to render the company knowledge panel. */
export function organizationJsonLd() {
  return {
    '@context': CONTEXT,
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    logo: absoluteUrl('/images/logo.png'),
  }
}

/** Website JSON-LD with a SearchAction so Google can show a sitelinks
 *  search box in SERPs. (Our search input on /catalog/ doesn't navigate
 *  yet, but the markup is forward-compatible.) */
export function websiteJsonLd() {
  return {
    '@context': CONTEXT,
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/catalog/?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
}

/** BreadcrumbList — the trail of links shown in rich results above a page's
 *  title. Position is 1-indexed; the final crumb is the current page and
 *  has no href. */
export function breadcrumbJsonLd(crumbs: Crumb[]) {
  return {
    '@context': CONTEXT,
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => {
      const item: Record<string, unknown> = {
        '@type': 'ListItem',
        position: i + 1,
        name: c.name,
      }
      if (c.href) item.item = c.href.startsWith('http') ? c.href : absoluteUrl(c.href)
      return item
    }),
  }
}

/** Product JSON-LD with an AggregateOffer covering the pack tier price
 *  range. Returns null for products without a usable price so we don't
 *  emit malformed schema.  */
export function productJsonLd(product: Product) {
  const base = parsePrice(product.price)
  const tiers = packTiers(base, product.packs)
  const perItemPrices = tiers.map(t => t.perItem).filter(n => n > 0)
  const productUrl = absoluteUrl(`/${product.slug}/`)

  const node: Record<string, unknown> = {
    '@context': CONTEXT,
    '@type': 'Product',
    name: product.name,
    description: product.description || `${product.name} — available at ${SITE_NAME}.`,
    url: productUrl,
    sku: product.slug,
  }

  if (product.images?.length) {
    node.image = product.images.map(img =>
      img.startsWith('http') ? img : absoluteUrl(img),
    )
  }
  if (product.brand) {
    node.brand = { '@type': 'Brand', name: product.brand }
  }
  if (product.ingredient) {
    node.additionalProperty = {
      '@type': 'PropertyValue',
      name: 'Active Ingredient',
      value: product.ingredient,
    }
  }
  if (product.reviews?.length) {
    const sum = product.reviews.reduce((s, r) => s + r.rating, 0)
    node.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: (sum / product.reviews.length).toFixed(2),
      reviewCount: product.reviews.length,
      bestRating: 5,
      worstRating: 1,
    }
  }
  if (perItemPrices.length > 0) {
    const low = Math.min(...perItemPrices)
    const high = Math.max(...perItemPrices)
    node.offers = {
      '@type': 'AggregateOffer',
      priceCurrency: 'USD',
      lowPrice: low.toFixed(2),
      highPrice: high.toFixed(2),
      offerCount: perItemPrices.length,
      availability: 'https://schema.org/InStock',
      url: productUrl,
    }
  }
  return node
}
