import { promises as fs } from 'node:fs'
import { loadHtml, loadHtmlFromFile } from './lib/loadHtml'
import type { ShippingDoc } from '@/data/types'

const SAVED_FILE = 'saved pages/NapsGear - shipping.php'
const DATA_FILE  = 'src/data/shipping.json'

// Shipping page is rendered as a flat sequence of <h4> headings each followed
// by one or more <p> paragraphs (and occasional <ul>). Walk the body and
// group siblings under whichever h4 most recently appeared. Stop traversal
// when we hit a known footer container so navigation/widget markup doesn't
// leak in.
const STOP_AT = new Set([
  'footer', 'aside', 'nav', 'script', 'style',
])

export function extractShipping(html: string): ShippingDoc {
  const $ = loadHtml(html)

  type Section = ShippingDoc['sections'][number]
  const sections: Section[] = []
  let current: Section | null = null

  // Walk all descendants of <body> in document order. We rely on cheerio's
  // descendant iteration following the source order.
  $('body').find('h4, p, ul').each((_, el) => {
    const tag = ('tagName' in el && el.tagName) ? el.tagName.toLowerCase() : ''
    if (!tag) return

    // Skip anything inside a stop container (footer/aside/nav/etc.)
    const $el = $(el)
    if ($el.parents(Array.from(STOP_AT).join(',')).length > 0) return

    if (tag === 'h4') {
      const heading = $el.text().trim()
      if (!heading) return
      current = { heading }
      sections.push(current)
      return
    }
    if (!current) return // ignore content before the first heading

    if (tag === 'p') {
      const text = $el.text().replace(/\s+/g, ' ').trim()
      if (!text) return
      current.paras = current.paras ?? []
      current.paras.push(text)
      return
    }
    if (tag === 'ul') {
      const items = $el.find('> li').map((_, li) => $(li).text().replace(/\s+/g, ' ').trim()).get().filter(Boolean)
      if (items.length === 0) return
      current.list = current.list ?? []
      current.list.push(...items)
    }
  })

  return { sections }
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
