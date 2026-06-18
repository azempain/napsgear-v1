// Pure: derive categories.json + brands.json from the mapped product set.
import type { NinegearCategory } from './types'
import type { Brand, Category } from '../../src/data/types'

export interface TaxonomyInput {
  slug: string
  brand?: string
  categories: NinegearCategory[]
}

function kebab(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function buildTaxonomy(items: TaxonomyInput[]): {
  categories: Category[]
  brands: Brand[]
} {
  const catMap = new Map<string, { name: string; slugs: string[] }>()
  const brandSet = new Map<string, string>() // slug -> name

  for (const it of items) {
    for (const c of it.categories) {
      const entry = catMap.get(c.slug) ?? { name: c.name, slugs: [] }
      entry.slugs.push(it.slug)
      catMap.set(c.slug, entry)
    }
    if (it.brand) {
      brandSet.set(kebab(it.brand), it.brand)
    }
  }

  const categories: Category[] = [...catMap.entries()]
    .map(([slug, { name, slugs }]) => ({
      slug,
      name,
      url: `/categories/${slug}`,
      productSlugs: slugs,
    }))
    .sort((a, b) => a.name.localeCompare(b.name))

  const brands: Brand[] = [...brandSet.entries()]
    .map(([slug, name]) => ({ slug, name, id: null, url: `/brands/${slug}` }))
    .sort((a, b) => a.name.localeCompare(b.name))

  return { categories, brands }
}
