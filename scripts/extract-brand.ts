// Reusable napsgear brand extractor.
//   npm run extract -- "<brand page>.html" [--details "<detail>.html" ...]
// Regenerates src/data/products.json + src/data/ingredients.json for the
// parsed brand and copies images from each page's _files/ dir into
// public/images/products/. Idempotent / re-runnable.

import fs from 'node:fs'
import path from 'node:path'
import {
  parseBrandPage,
  parseDetailPage,
  applyDetails,
  mergeProducts,
  mergeIngredients,
} from '../src/lib/extract'
import type { Product, Ingredient } from '../src/data/types'

const ROOT = path.join(__dirname, '..')
const PRODUCTS = path.join(ROOT, 'src/data/products.json')
const INGREDIENTS = path.join(ROOT, 'src/data/ingredients.json')
const IMG_OUT = path.join(ROOT, 'public/images/products')

function readArgs(argv: string[]) {
  const args = argv.slice(2)
  const brandFile = args[0]
  const details: string[] = []
  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--details' && i + 1 < args.length) {
      details.push(args[++i])
    }
  }
  return { brandFile, details }
}

function filesDir(htmlPath: string): string {
  return `${htmlPath.replace(/\.html$/i, '')}_files`
}

function copyImages(dir: string): number {
  if (!fs.existsSync(dir)) return 0
  fs.mkdirSync(IMG_OUT, { recursive: true })
  let n = 0
  for (const f of fs.readdirSync(dir)) {
    if (/\.(jpe?g|png|webp|gif|svg)$/i.test(f)) {
      fs.copyFileSync(path.join(dir, f), path.join(IMG_OUT, f))
      n++
    }
  }
  return n
}

function readJson<T>(p: string, fallback: T): T {
  return fs.existsSync(p) ? (JSON.parse(fs.readFileSync(p, 'utf8')) as T) : fallback
}

const { brandFile, details } = readArgs(process.argv)
if (!brandFile) {
  console.error('Usage: npm run extract -- "<brand page>.html" [--details "<detail>.html" ...]')
  process.exit(1)
}

const { brand, products, ingredients } = parseBrandPage(fs.readFileSync(brandFile, 'utf8'))
const detailResults = details.map((d) => parseDetailPage(fs.readFileSync(d, 'utf8')))
const enriched = applyDetails(products, detailResults)

const mergedProducts = mergeProducts(readJson<Product[]>(PRODUCTS, []), brand, enriched)
const mergedIngredients = mergeIngredients(readJson<Ingredient[]>(INGREDIENTS, []), brand, ingredients)

fs.writeFileSync(PRODUCTS, JSON.stringify(mergedProducts, null, 2) + '\n')
fs.writeFileSync(INGREDIENTS, JSON.stringify(mergedIngredients, null, 2) + '\n')

let imgs = copyImages(filesDir(brandFile))
for (const d of details) imgs += copyImages(filesDir(d))

console.log(`Brand: ${brand}`)
console.log(`Products: ${enriched.length} (merged total ${mergedProducts.length})`)
console.log(`Ingredients: ${ingredients.length}`)
console.log(`Detail pages applied: ${details.length}`)
console.log(`Images copied: ${imgs} -> public/images/products/`)
