import { promises as fs } from 'node:fs'
import { loadHtml, loadHtmlFromFile } from './lib/loadHtml'
import type { Video } from '@/data/types'

const SAVED_FILE = 'saved pages/NapsGear - ama.php'
const DATA_FILE  = 'src/data/videos.json'

export function extractVideos(html: string): Video[] {
  const $ = loadHtml(html)
  const out: Video[] = []
  $('.video-item').each((_, el) => {
    const $el = $(el)
    const url = $el.find('.video-item__thumbnail a').first().attr('href')?.trim()
      || $el.find('.video-item__link').first().attr('href')?.trim()
    const title = $el.find('.video-item_title').first().text().trim()
      || $el.find('.video-item__link').first().attr('title')?.trim() || ''
    if (!url || !title) return
    const thumbnail = $el.find('img.video_tb, .video-item__thumbnail img').first().attr('src')?.trim() ?? ''
    // Date is rendered as "Added: 13 hours ago" — strip the "Added:" prefix
    const dateRaw = $el.find('.date-added').first().text().trim()
    const date = dateRaw.replace(/^Added:\s*/i, '').trim()
    out.push({ url, title, date, thumbnail })
  })
  return out
}

export interface AmaSummary { added: number; total: number }

export async function runAma(): Promise<AmaSummary> {
  let existing: Video[] = []
  try {
    existing = JSON.parse(await fs.readFile(DATA_FILE, 'utf8')) as Video[]
  } catch { existing = [] }

  const $ = await loadHtmlFromFile(SAVED_FILE)
  const incoming = extractVideos($.html() ?? '')

  const seen = new Set(existing.map(v => v.url))
  const merged = [...existing]
  let added = 0
  for (const v of incoming) {
    if (seen.has(v.url)) continue
    merged.push(v)
    seen.add(v.url)
    added++
  }
  await fs.writeFile(DATA_FILE, JSON.stringify(merged, null, 2) + '\n', 'utf8')
  return { added, total: merged.length }
}
