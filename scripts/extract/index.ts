#!/usr/bin/env tsx
// Saved-pages extraction driver. Runs every extractor in dependency order
// and prints a one-line summary per extractor.

import { runProducts } from './products'
import { runCategories } from './categories'
import { runIngredients } from './ingredients'
import { runFaq } from './faq'
import { runShipping } from './shipping'
import { runPromotions } from './promotions'
import { runContact } from './contact'
import { runAma } from './ama'
import { runAffiliate } from './affiliate'
import { runDiaries } from './diaries'

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

  const f = await runFaq()
  console.log(`${pad('faq')}+${f.entries} entries`)

  const s = await runShipping()
  console.log(`${pad('shipping')}${s.sections} sections (${s.items} items)`)

  const pr = await runPromotions()
  console.log(`${pad('promotions')}+${pr.count} promotions (${pr.copiedImages} images copied)`)

  await runContact()
  console.log(`${pad('contact')}written`)

  const a = await runAma()
  console.log(`${pad('ama')}+${a.added} videos (${a.total} total)`)

  await runAffiliate()
  console.log(`${pad('affiliate')}written`)

  const d = await runDiaries()
  console.log(`${pad('diaries')}+${d.count} entries (${d.copiedImages} images copied)`)

  console.log('\n✓ done.')
}

main().catch(err => {
  console.error('\n× extraction failed:')
  console.error(err)
  process.exit(1)
})
