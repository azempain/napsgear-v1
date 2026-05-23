#!/usr/bin/env tsx
// Saved-pages extraction driver. Runs every extractor in dependency order
// and prints a one-line summary per extractor.

import { runProducts } from './products'
import { runCategories } from './categories'
import { runIngredients } from './ingredients'

function pad(s: string, w = 16): string {
  return s.length >= w ? s : s + ' '.repeat(w - s.length)
}

async function main() {
  console.log('Saved-pages extraction starting…\n')

  const p = await runProducts()
  console.log(`${pad('products')}+${p.added} new   ${p.updated} updated   ${p.unchanged} unchanged   (${p.copiedImages} images copied)`)

  const c = await runCategories()
  console.log(`${pad('categories')}+${c.added} new   ${c.updated} updated   ${c.unchanged} unchanged`)

  const i = await runIngredients()
  console.log(`${pad('ingredients')}rebuilt   ${i.distinct} distinct`)

  console.log('\n✓ done.')
}

main().catch(err => {
  console.error('\n× extraction failed:')
  console.error(err)
  process.exit(1)
})
