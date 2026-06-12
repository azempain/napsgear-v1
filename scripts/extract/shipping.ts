import { promises as fs } from 'node:fs'
import { loadHtml, loadHtmlFromFile } from './lib/loadHtml'
import type { ShippingDoc } from '@/data/types'

const SAVED_FILE = 'saved pages/NapsGear - shipping.php'
const DATA_FILE  = 'src/data/shipping.json'

export function extractShipping(html: string): ShippingDoc {
  const $ = loadHtml(html)
  const $policy = $('main table td.main').first()
  if ($policy.length === 0) return { sections: [] }

  const policyHtml = $policy.html() ?? ''
  const lines = loadHtml(`<div>${policyHtml.replace(/<br\s*\/?>/gi, '\n')}</div>`)
    .root()
    .text()
    .split('\n')
    .map(line => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)

  const headingIndexes = new Map<string, string>([
    ['First Class Shipping fees cover', 'First Class Shipping'],
    ['Domestic Orders', 'Domestic Orders'],
    ['International Orders', 'International Orders'],
    ['Customs Clearance:', 'Customs Clearance'],
  ])

  const sections: ShippingDoc['sections'] = []
  let current = { heading: 'Shipping overview', paras: [] as string[] }
  sections.push(current)

  for (const line of lines) {
    const headingMatch = [...headingIndexes.entries()].find(([prefix]) => line.startsWith(prefix))
    if (headingMatch) {
      const [prefix, heading] = headingMatch
      current = { heading, paras: [] }
      sections.push(current)
      const remainder = line.slice(prefix.length).trim()
      if (remainder) current.paras.push(
        heading === 'First Class Shipping' ? `First Class Shipping fees cover ${remainder}` : remainder,
      )
      continue
    }
    current.paras.push(line)
  }

  return {
    sections: sections
      .map(section => ({ ...section, paras: section.paras.filter(Boolean) }))
      .filter(section => section.paras.length > 0),
  }
}

export interface ShippingSummary { sections: number; items: number }

export async function runShipping(): Promise<ShippingSummary> {
  const $ = await loadHtmlFromFile(SAVED_FILE)
  const doc = extractShipping($.html() ?? '')
  await fs.writeFile(DATA_FILE, JSON.stringify(doc, null, 2) + '\n', 'utf8')
  const items = doc.sections.reduce(
    (sum, s) => sum + (s.paras?.length ?? 0) + (s.list?.length ?? 0),
    0,
  )
  return { sections: doc.sections.length, items }
}
