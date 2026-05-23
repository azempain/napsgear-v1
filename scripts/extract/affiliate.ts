import { promises as fs } from 'node:fs'
import { loadHtml, loadHtmlFromFile } from './lib/loadHtml'
import type { AffiliateDoc } from '@/data/types'

const SAVED_FILE = 'saved pages/Napsgear Affiliate Program - pap - affiliates.html'
const DATA_FILE  = 'src/data/affiliate.json'

export function extractAffiliate(html: string): AffiliateDoc {
  const $ = loadHtml(html)

  // Walk the document; collect paragraphs into the "current" bucket (intro
  // before the first h1, otherwise the active section). The h1.text-uppercase
  // marker delineates sections — matches what the saved affiliate page uses.
  const introParas: string[] = []
  const sections: AffiliateDoc['sections'] = []
  let activeSection: AffiliateDoc['sections'][number] | null = null

  $('body').find('h1, p').each((_, el) => {
    if (!('tagName' in el) || !el.tagName) return
    const tag = el.tagName.toLowerCase()
    const $el = $(el)

    // Skip nav/header/footer content
    if ($el.parents('nav, header, footer, aside').length > 0) return

    if (tag === 'h1') {
      const heading = $el.text().trim()
      if (!heading) return
      activeSection = { heading, paras: [] }
      sections.push(activeSection)
      return
    }
    if (tag === 'p') {
      const text = $el.text().replace(/\s+/g, ' ').trim()
      if (!text) return
      if (activeSection) activeSection.paras.push(text)
      else introParas.push(text)
    }
  })

  const heading = sections[0]?.heading ?? 'Affiliate Program'
  const intro = introParas.join('\n\n')

  // CTA — find a "Sign up" link near the top of the document
  let cta: AffiliateDoc['cta']
  $('a').each((_, a) => {
    if (cta) return
    const $a = $(a)
    if ($a.parents('nav, footer, aside').length > 0) return
    const text = $a.text().replace(/\s+/g, ' ').trim()
    const href = $a.attr('href')?.trim()
    if (!text || !href) return
    if (/^sign\s*up$/i.test(text) || /^join/i.test(text)) {
      cta = { label: text, href }
    }
  })

  const out: AffiliateDoc = { heading, intro, sections }
  if (cta) out.cta = cta
  return out
}

export async function runAffiliate(): Promise<{ ok: boolean }> {
  const $ = await loadHtmlFromFile(SAVED_FILE)
  const data = extractAffiliate($.html() ?? '')
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2) + '\n', 'utf8')
  return { ok: true }
}
