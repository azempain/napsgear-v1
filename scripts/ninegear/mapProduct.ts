// Pure: one ninegear Store-API product -> our Product, plus the remote→local
// image map the orchestrator uses to download binaries.
import type { NinegearProduct } from './types'
import type { Product } from '../../src/data/types'
import { parseSpecTable } from './parseSpecTable'

export interface ImageRef {
  remote: string
  local: string
}

export interface MappedProduct {
  product: Product
  images: ImageRef[]
}

// Spec-table fields that aren't useful prose in the description body.
const SKIP_FIELDS = new Set<string>()

// The Store API's `images[]` mixes the real product photo (always first) with
// Woodmart theme assets: shipping-flag icons (us-flag.png, int-flag.png,
// eu-flag.png, uk-flag1.png), the "default" placeholder
// (en-default-medium_default.webp), and small UI icons (test-icon-min2.png).
// None are product imagery — drop them.
const JUNK_IMAGE = /(?:[a-z]{2,3}-flag\d*\.(?:png|jpe?g|webp)|default|-icon)/i

function isJunkImage(url: string): boolean {
  const basename = url.split('/').pop() ?? url
  return JUNK_IMAGE.test(basename)
}

function extFromUrl(url: string): string {
  try {
    const ext = new URL(url).pathname.match(/\.([a-z0-9]+)$/i)?.[1]
    return ext ? `.${ext.toLowerCase()}` : '.jpg'
  } catch {
    return '.jpg'
  }
}

function buildDescription(
  fields: Record<string, string>,
  name: string,
  category: string | undefined,
): string {
  const lines = Object.entries(fields)
    .filter(([k]) => !SKIP_FIELDS.has(k))
    .map(([k, v]) => `${k}: ${v}`)
  if (lines.length) return lines.join('\n')
  // Fallback for products with no spec table.
  const cat = category ? ` in our ${category} range` : ''
  return `${name}${cat}. Sourced and shipped from the USA. Contact support for detailed product information, dosing guidance, and availability.`
}

export function mapProduct(np: NinegearProduct): MappedProduct {
  const { brand, fields } = parseSpecTable(np.short_description)

  // Dedupe images by remote src, keep order, rewrite to local paths.
  const seen = new Set<string>()
  const images: ImageRef[] = []
  for (const img of np.images) {
    if (!img?.src || seen.has(img.src) || isJunkImage(img.src)) continue
    seen.add(img.src)
    const local = `/images/products/${np.slug}-${images.length + 1}${extFromUrl(img.src)}`
    images.push({ remote: img.src, local })
  }

  const category = np.categories[0]?.name
  const product: Product = {
    slug: np.slug,
    name: np.name,
    description: buildDescription(fields, np.name, category),
    images: images.map((i) => i.local),
    price: `$${np.prices.price}`,
    ...(brand ? { brand } : {}),
    ...(np.on_sale ? { labels: { sale: 'Sale' } } : {}),
  }

  return { product, images }
}
