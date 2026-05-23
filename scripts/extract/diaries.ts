import { promises as fs } from 'node:fs'
import path from 'node:path'
import { loadHtml, loadHtmlFromFile } from './lib/loadHtml'
import { copyAsset } from './lib/copyAsset'
import type { DiaryEntry } from '@/data/types'

const SAVED_FILE = 'saved pages/NapsGear - AAS Diaries.html'
const PUBLIC_DIR = 'public/images/diaries'
const DATA_FILE  = 'src/data/diaries.json'

/** Pull the id out of /aas_diaries.php?id=NNNN → "NNNN" */
function slugFromHref(href: string | undefined): string {
  if (!href) return ''
  const m = href.match(/[?&]id=(\d+)/)
  return m ? m[1] : ''
}

export function extractDiaries(html: string): DiaryEntry[] {
  const $ = loadHtml(html)
  const out: DiaryEntry[] = []

  $('.aas-item').each((_, el) => {
    const $el = $(el)
    const titleAnchor = $el.find('.aas-item__content h4 a').first()
    const sourceUrl = titleAnchor.attr('href')?.trim()
    const slug = slugFromHref(sourceUrl)
    const title = titleAnchor.text().trim()
    if (!slug || !title) return

    // Author rendered as "By: Anon_SA" — strip the "By:" prefix when present
    const authorRaw = $el.find('.aas-item__author').first().text().trim()
    const author = authorRaw.replace(/^by\s*:\s*/i, '').trim() || undefined

    // Date is relative — "Last updated: 14 hours ago"
    const dateRaw = $el.find('.aas-date small').first().text().trim()
    const date = dateRaw.replace(/^Last updated:\s*/i, '').trim()

    const excerpt = $el.find('.aas-text').first().text().replace(/\s+/g, ' ').trim()
    const thumbnail = $el.find('figure img').first().attr('src')?.trim()

    out.push({
      slug,
      title,
      ...(author ? { author } : {}),
      date,
      excerpt,
      ...(sourceUrl ? { sourceUrl } : {}),
      ...(thumbnail ? { thumbnail } : {}),
    })
  })

  return out
}

export interface DiariesSummary { count: number; copiedImages: number }

export async function runDiaries(): Promise<DiariesSummary> {
  const baseDir = path.dirname(path.resolve(SAVED_FILE))
  const $ = await loadHtmlFromFile(SAVED_FILE)
  const diaries = extractDiaries($.html() ?? '')

  let copiedImages = 0
  for (const d of diaries) {
    if (!d.thumbnail || d.thumbnail.startsWith('/images/')) continue
    const cleaned = d.thumbnail.replace(/^\.?\/+/, '')
    const absSrc = path.resolve(baseDir, cleaned)
    try {
      await fs.stat(absSrc)
      const ext = (path.extname(absSrc) || '.jpg').toLowerCase()
      const publicName = `${d.slug}${ext}`
      const dst = path.join(PUBLIC_DIR, publicName)
      const r = await copyAsset(absSrc, dst)
      if (r.copied) copiedImages++
      d.thumbnail = `/images/diaries/${publicName}`
    } catch {
      delete d.thumbnail
    }
  }

  await fs.writeFile(DATA_FILE, JSON.stringify(diaries, null, 2) + '\n', 'utf8')
  return { count: diaries.length, copiedImages }
}
