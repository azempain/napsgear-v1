// Run: pnpm fetch:ninegear
// Fetches the full ninegear.us catalog and rewrites the three data JSON
// files + downloads product images. Re-runnable; output is deterministic
// except for live catalog changes upstream.
import * as fs from 'node:fs'
import * as path from 'node:path'
import { fetchAllProducts } from './api'
import { mapProduct } from './mapProduct'
import { seedReviews, type DateWindow } from './seedReviews'
import { buildTaxonomy, type TaxonomyInput } from './buildTaxonomy'
import { downloadImage } from './downloadImages'

const ROOT = path.join(__dirname, '..', '..')
const DATA = path.join(ROOT, 'src', 'data')
const PUBLIC_IMG = path.join(ROOT, 'public', 'images', 'products')

// Fixed window so seeded review dates are reproducible across runs.
const WINDOW: DateWindow = {
  startMs: Date.parse('2024-01-01'),
  endMs: Date.parse('2025-06-01'),
}

function writeJson(file: string, data: unknown): void {
  fs.writeFileSync(path.join(DATA, file), JSON.stringify(data, null, 2) + '\n', 'utf8')
}

async function main(): Promise<void> {
  console.log('🚀  Fetching ninegear.us catalog via Store API …')
  const raw = await fetchAllProducts()
  console.log(`   ${raw.length} products fetched`)

  const taxonomyInput: TaxonomyInput[] = []
  const products = raw.map((np) => {
    const { product, images } = mapProduct(np)
    const { reviews, qa } = seedReviews(product.slug, WINDOW)
    if (reviews.length) product.reviews = reviews
    if (qa.length) product.qa = qa
    taxonomyInput.push({ slug: product.slug, brand: product.brand, categories: np.categories })
    return { product, images }
  })

  const { categories, brands } = buildTaxonomy(taxonomyInput)
  console.log(`   ${categories.length} categories, ${brands.length} brands`)

  writeJson('products.json', products.map((p) => p.product))
  writeJson('categories.json', categories)
  writeJson('brands.json', brands)
  console.log('   ✅  Wrote products.json, categories.json, brands.json')

  // Download images (deduped across the catalog by dest path).
  fs.mkdirSync(PUBLIC_IMG, { recursive: true })
  let ok = 0
  let fail = 0
  const jobs: Array<{ remote: string; dest: string }> = []
  const seen = new Set<string>()
  for (const { images } of products) {
    for (const ref of images) {
      const dest = path.join(ROOT, 'public', ref.local.replace(/^\//, '').split('/').join(path.sep))
      if (seen.has(dest)) continue
      seen.add(dest)
      jobs.push({ remote: ref.remote, dest })
    }
  }
  console.log(`🖼️   Downloading ${jobs.length} images …`)
  for (let i = 0; i < jobs.length; i++) {
    const { remote, dest } = jobs[i]
    const success = await downloadImage(remote, dest)
    if (success) ok++
    else {
      fail++
      console.warn(`   ⚠️  failed: ${remote}`)
    }
    if ((i + 1) % 50 === 0) console.log(`   ${i + 1}/${jobs.length}`)
  }
  console.log(`\n✅  Images: ${ok} ok, ${fail} failed`)
  console.log('   Next: pnpm optimize-images')
}

main().catch((err) => {
  console.error('❌  Fatal:', err instanceof Error ? err.message : err)
  process.exit(1)
})
