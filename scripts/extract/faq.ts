import { promises as fs } from 'node:fs'
import { loadHtml, loadHtmlFromFile } from './lib/loadHtml'
import type { FaqEntry } from '@/data/types'

const SAVED_FILE = 'saved pages/faq - Knowledgebase.html'
const DATA_FILE  = 'src/data/faq.json'

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export function extractFaq(html: string): FaqEntry[] {
  const $ = loadHtml(html)
  const out: FaqEntry[] = []
  $('.dialog-block').each((_, block) => {
    const $block = $(block)
    const category = $block.find('.dialog-block-title a.link-icon').first().text().trim() || undefined
    $block.find('.list-kb li a').each((_, a) => {
      const $a = $(a)
      const question = $a.text().trim()
      const sourceUrl = $a.attr('href')?.trim()
      if (!question) return
      out.push({
        id: slugify(question),
        question,
        ...(category ? { category } : {}),
        ...(sourceUrl ? { sourceUrl } : {}),
      })
    })
  })
  return out
}

export interface FaqSummary { entries: number }

export async function runFaq(): Promise<FaqSummary> {
  const $ = await loadHtmlFromFile(SAVED_FILE)
  const entries = extractFaq($.html() ?? '')
  await fs.writeFile(DATA_FILE, JSON.stringify(entries, null, 2) + '\n', 'utf8')
  return { entries: entries.length }
}
