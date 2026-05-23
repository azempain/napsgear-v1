import { promises as fs } from 'node:fs'
import path from 'node:path'
import { loadHtml, loadHtmlFromFile } from './lib/loadHtml'
import { mergeBySlug } from './lib/mergeBySlug'
import type { Category } from '@/data/types'

const SAVED_DIR = 'saved pages'
const DATA_FILE = 'src/data/categories.json'

const CATEGORY_FILES = [
  'NapsGear - Oral steroids.html',
]

/** Strip query/hash and trailing slash, return last path segment. */
function slugFromHref(href: string | undefined): string {
  if (!href) return ''
  const noQuery = href.split('?')[0].split('#')[0]
  return noQuery.replace(/^https?:\/\/[^/]+/, '').replace(/^\/+|\/+$/g, '').split('/').pop() ?? ''
}

/** Find the first href in the doc that matches the category URL pattern
 *  /<name>-c<id>, return that as the slug. */
function findCategorySlug($: ReturnType<typeof loadHtml>): string {
  let slug = ''
  $('a[href]').each((_, a) => {
    if (slug) return
    const raw = ($(a).attr('href') ?? '').split('?')[0].split('#')[0]
    const seg = raw.replace(/^https?:\/\/[^/]+/, '').replace(/^\/+|\/+$/g, '').split('/').pop() ?? ''
    if (/^[a-z0-9-]+-c\d+$/i.test(seg)) {
      slug = seg
    }
  })
  return slug
}

export function extractCategory(html: string): Category & { productSlugs: string[] } {
  const $ = loadHtml(html)
  const name = $('.category-title').first().text().trim()
  const slug = findCategorySlug($)
  if (!name || !slug) {
    throw new Error(`extractCategory: missing name (${name}) or slug (${slug})`)
  }
  const productSlugs: string[] = []
  $('.product-item__title a, .product-item .product-item__title a').each((_, a) => {
    const s = slugFromHref($(a).attr('href'))
    if (s) productSlugs.push(s)
  })
  return {
    slug,
    name,
    url: `/categories/${slug}`,
    productSlugs,
  }
}

export interface CategorySummary {
  added: number
  updated: number
  unchanged: number
}

export async function runCategories(): Promise<CategorySummary> {
  let existing: Category[] = []
  try {
    existing = JSON.parse(await fs.readFile(DATA_FILE, 'utf8')) as Category[]
  } catch {
    existing = []
  }

  const incoming: Category[] = []
  for (const f of CATEGORY_FILES) {
    const $ = await loadHtmlFromFile(path.join(SAVED_DIR, f))
    incoming.push(extractCategory($.html() ?? ''))
  }

  const result = mergeBySlug(existing, incoming)
  await fs.writeFile(DATA_FILE, JSON.stringify(result.merged, null, 2) + '\n', 'utf8')
  return {
    added: result.added,
    updated: result.updated,
    unchanged: result.unchanged,
  }
}
