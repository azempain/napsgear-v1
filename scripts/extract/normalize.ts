// Post-extraction normalization passes. Run after every extractor so the
// catalog self-heals when sources change or extractors add duplicate entries
// with slightly different slugs.

import { promises as fs } from 'node:fs'
import path from 'node:path'
import type { Product } from '@/data/types'

const PRODUCTS_FILE = 'src/data/products.json'
const PUBLIC_ROOT   = 'public'

/** Pick the entry with the most populated fields when two share brand+name.
 *  "Most populated" = longest description, breaking ties by presence of
 *  packs[], reviews[], qa[]. Fills the keeper's missing optional fields
 *  from the discarded duplicates so we don't lose data. */
export function dedupeByBrandName(products: Product[]): { kept: Product[]; removed: number } {
  const groups = new Map<string, Product[]>()
  const ungrouped: Product[] = []
  for (const p of products) {
    if (!p.brand || !p.name) { ungrouped.push(p); continue }
    const key = `${p.brand}|${p.name}`
    const arr = groups.get(key) ?? []
    arr.push(p)
    groups.set(key, arr)
  }

  const kept: Product[] = [...ungrouped]
  let removed = 0
  for (const [, arr] of groups) {
    if (arr.length === 1) { kept.push(arr[0]); continue }
    // Score: description length wins; packs/reviews/qa break ties
    const ranked = [...arr].sort((a, b) => {
      const dl = (b.description?.length ?? 0) - (a.description?.length ?? 0)
      if (dl !== 0) return dl
      const score = (p: Product) =>
        (p.packs?.length ?? 0) * 10 +
        (p.reviews?.length ?? 0) * 5 +
        (p.qa?.length ?? 0) * 3 +
        (p.images?.length ?? 0)
      return score(b) - score(a)
    })
    const winner = ranked[0]
    // Fill any winner-missing fields from the rest
    for (const loser of ranked.slice(1)) {
      if (!winner.description && loser.description) winner.description = loser.description
      if (!winner.packs?.length && loser.packs?.length) winner.packs = loser.packs
      if (!winner.reviews?.length && loser.reviews?.length) winner.reviews = loser.reviews
      if (!winner.qa?.length && loser.qa?.length) winner.qa = loser.qa
      if (!winner.images?.length && loser.images?.length) winner.images = loser.images
      if (!winner.ingredient && loser.ingredient) winner.ingredient = loser.ingredient
      if (!winner.price && loser.price) winner.price = loser.price
      if (!winner.labels && loser.labels) winner.labels = loser.labels
    }
    kept.push(winner)
    removed += arr.length - 1
  }
  return { kept, removed }
}

/** Walks each product's images[]; drops entries that point at /images/<...>
 *  files that don't exist under publicRoot. Absolute (http*) URLs are kept
 *  unchanged. When NO image survives, images is left as an empty array so
 *  the renderer falls back to its placeholder (no broken alt text). */
export async function dropMissingImages(
  products: Product[],
  publicRoot: string = PUBLIC_ROOT,
): Promise<{ products: Product[]; brokenStripped: number }> {
  let brokenStripped = 0
  for (const p of products) {
    if (!p.images?.length) continue
    const surviving: string[] = []
    for (const src of p.images) {
      if (/^https?:\/\//i.test(src)) { surviving.push(src); continue }
      if (src.startsWith('/')) {
        const onDisk = path.join(publicRoot, src.replace(/^\/+/, ''))
        try {
          await fs.stat(onDisk)
          surviving.push(src)
        } catch {
          brokenStripped++
        }
      } else {
        // Raw (./<page>_files/) paths never made it to public/, drop them.
        brokenStripped++
      }
    }
    p.images = surviving
  }
  return { products, brokenStripped }
}

export interface NormalizeSummary {
  removed: number
  brokenStripped: number
  total: number
}

export async function runNormalize(): Promise<NormalizeSummary> {
  const products = JSON.parse(await fs.readFile(PRODUCTS_FILE, 'utf8')) as Product[]
  const dedup = dedupeByBrandName(products)
  const stripped = await dropMissingImages(dedup.kept)
  await fs.writeFile(PRODUCTS_FILE, JSON.stringify(stripped.products, null, 2) + '\n', 'utf8')
  return {
    removed: dedup.removed,
    brokenStripped: stripped.brokenStripped,
    total: stripped.products.length,
  }
}
