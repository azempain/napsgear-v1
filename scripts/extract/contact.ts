import { promises as fs } from 'node:fs'
import { loadHtml, loadHtmlFromFile } from './lib/loadHtml'
import type { ContactInfo } from '@/data/types'

const SAVED_FILE = 'saved pages/NapsHelp - Contact page.html'
const DATA_FILE  = 'src/data/contact.json'

export function extractContact(html: string): ContactInfo {
  const $ = loadHtml(html)

  // Heading — usually .page-title
  const heading = $('h1.page-title').first().text().trim() || $('h1').first().text().trim() || undefined

  // Email — first mailto link, if any
  const mailto = $('a[href^="mailto:"]').first().attr('href')
  const email = mailto ? mailto.replace(/^mailto:/, '').trim() : undefined

  // formAction — first form's action attribute
  const formAction = $('form[action]').first().attr('action')?.trim() || undefined

  // portalUrl — if formAction is an absolute URL on a different host, capture its origin
  let portalUrl: string | undefined
  if (formAction && /^https?:\/\//.test(formAction)) {
    try {
      const u = new URL(formAction)
      portalUrl = `${u.protocol}//${u.host}`
    } catch {
      portalUrl = undefined
    }
  }

  const out: ContactInfo = {}
  if (heading) out.heading = heading
  if (email) out.email = email
  if (formAction) out.formAction = formAction
  if (portalUrl) out.portalUrl = portalUrl
  const actions = $('.dialog-block').map((_, block) => {
    const $block = $(block)
    const $link = $block.find('.dialog-block-title a[href]').first()
    const label = $link.text().replace(/\s+/g, ' ').trim()
    const sourceHref = $link.attr('href')?.trim()
    const href = sourceHref?.includes('napsgear.org/qa.php') ? '/qa/' : sourceHref
    const description = $block.find('.dialog-block-body').first().text().replace(/\s+/g, ' ').trim()
    return label && href && description ? { label, href, description } : null
  }).get().filter((action): action is NonNullable<typeof action> => action !== null)
  if (actions.length > 0) out.actions = actions
  return out
}

export async function runContact(): Promise<{ ok: boolean }> {
  const $ = await loadHtmlFromFile(SAVED_FILE)
  const data = extractContact($.html() ?? '')
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2) + '\n', 'utf8')
  return { ok: true }
}
