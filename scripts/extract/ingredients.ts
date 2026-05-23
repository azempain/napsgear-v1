import { promises as fs } from 'node:fs'
import { createHash } from 'node:crypto'
import type { Product, Ingredient } from '@/data/types'

const PRODUCTS_FILE    = 'src/data/products.json'
const INGREDIENTS_FILE = 'src/data/ingredients.json'

function stableId(brand: string, name: string): number {
  // First 9 hex chars → ~36 bits → fits in JS number safely
  const h = createHash('sha1').update(`${brand}|${name}`).digest('hex').slice(0, 9)
  return parseInt(h, 16)
}

export function deriveIngredients(products: Product[]): Ingredient[] {
  const counts = new Map<string, { brand: string; name: string; count: number }>()
  for (const p of products) {
    if (!p.brand || !p.ingredient) continue
    const key = `${p.brand}::${p.ingredient}`
    const existing = counts.get(key)
    if (existing) existing.count++
    else counts.set(key, { brand: p.brand, name: p.ingredient, count: 1 })
  }
  return Array.from(counts.values())
    .map(({ brand, name, count }) => ({ id: stableId(brand, name), brand, name, count }))
    .sort((a, b) => a.brand.localeCompare(b.brand) || a.name.localeCompare(b.name))
}

export interface IngredientsSummary {
  distinct: number
}

export async function runIngredients(): Promise<IngredientsSummary> {
  const products = JSON.parse(await fs.readFile(PRODUCTS_FILE, 'utf8')) as Product[]
  const list = deriveIngredients(products)
  await fs.writeFile(INGREDIENTS_FILE, JSON.stringify(list, null, 2) + '\n', 'utf8')
  return { distinct: list.length }
}
