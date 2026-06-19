import { promises as fs } from 'node:fs'
import path from 'node:path'
import { loadHtml, loadHtmlFromFile } from './lib/loadHtml'
import { copyAsset } from './lib/copyAsset'
import { slugify } from './lib/slugify'
import type { Promotion } from '@/data/types'

const SAVED_FILE = 'saved pages/NapsGear - All promotions.html'
const PUBLIC_DIR = 'public/images/promotions'
const DATA_FILE  = 'src/data/promotions.json'

/** Promotions page is structured as: h4 heading + (ul of links) OR (div with
 *  banner anchor). Each link becomes its own Promotion; the h4 text goes into
 *  `body` so the renderer can preserve the section grouping context. Banner
 *  anchors with an <img> child also become promos with the image captured. */
export function extractPromotions(html: string): Promotion[] {
  const $ = loadHtml(html)
  const out: Promotion[] = []

  // Walk the main content, tracking the most recent h4 as the section heading
  let section = ''
  $('main.main, main').first().find('h4, ul, div.pb-3, .container').each((_, el) => {
    if (!('tagName' in el) || !el.tagName) return
    const tag = el.tagName.toLowerCase()
    const $el = $(el)

    if (tag === 'h4') {
      section = $el.text().trim()
      return
    }
    if (!section) return

    if (tag === 'ul') {
      $el.find('> li > a').each((_, a) => {
        const $a = $(a)
        const title = $a.text().trim()
        const href = $a.attr('href')?.trim()
        if (!title || !href) return
        out.push({
          id: slugify(title),
          title,
          body: section,
          cta: { label: title, href },
        })
      })
      return
    }

    // Banner-style: <div class="pb-3"><a href=...><img src=... /></a></div>
    if (tag === 'div') {
      const anchor = $el.find('> a').first()
      const img = anchor.find('img').first()
      if (img.length === 0) return
      const href = anchor.attr('href')?.trim()
      const imgSrc = img.attr('src')?.trim()
      if (!href || !imgSrc) return
      // The h4 itself is the title for banner-style promos
      out.push({
        id: slugify(section),
        title: section,
        body: '',
        cta: { label: 'View', href },
        image: imgSrc,
      })
    }
  })

  return out
}

export interface PromotionsSummary { count: number; copiedImages: number }

export async function runPromotions(): Promise<PromotionsSummary> {
  const baseDir = path.dirname(path.resolve(SAVED_FILE))
  const $ = await loadHtmlFromFile(SAVED_FILE)
  const promos = extractPromotions($.html() ?? '')

  let copiedImages = 0
  for (const p of promos) {
    if (!p.image) continue
    const cleaned = p.image.replace(/^\.?\/+/, '')
    const absSrc = path.resolve(baseDir, cleaned)
    try {
      await fs.stat(absSrc)
      const ext = (path.extname(absSrc) || '.jpg').toLowerCase()
      const publicName = `${p.id}${ext}`
      const dst = path.join(PUBLIC_DIR, publicName)
      const r = await copyAsset(absSrc, dst)
      if (r.copied) copiedImages++
      p.image = `/images/promotions/${publicName}`
    } catch {
      // Source image missing — drop the field rather than ship a broken path
      delete p.image
    }
  }

  await fs.writeFile(DATA_FILE, JSON.stringify(promos, null, 2) + '\n', 'utf8')
  return { count: promos.length, copiedImages }
}
