// HTML sanitizer with a tight allowlist. Runs at extraction time so the JSON
// only ever contains known-safe markup; the runtime renderer can trust it.

import * as cheerio from 'cheerio'

const ALLOWED_TAGS = new Set([
  'p', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'a', 'em', 'strong',
  'blockquote', 'img', 'br',
])

const ALLOWED_ATTRS_PER_TAG: Record<string, Set<string>> = {
  a:   new Set(['href', 'title']),
  img: new Set(['src', 'alt', 'title']),
}

const NAPSGEAR_ORIGIN = /^https?:\/\/(www\.)?napsgear\.org\//i

function rewriteHref(href: string): string | null {
  const trimmed = href.trim()
  // Local relative — keep
  if (trimmed.startsWith('/')) return trimmed
  // napsgear.org absolute — strip origin
  if (NAPSGEAR_ORIGIN.test(trimmed)) return trimmed.replace(NAPSGEAR_ORIGIN, '/')
  // Other https — keep (e.g. references to external articles)
  if (/^https:\/\//i.test(trimmed)) return trimmed
  // Drop everything else (javascript:, data:, http: insecure, mailto: etc.)
  return null
}

function rewriteImgSrc(src: string): string | null {
  const trimmed = src.trim()
  // Only local image paths survive
  if (trimmed.startsWith('/images/')) return trimmed
  return null
}

export function sanitize(html: string): string {
  const $ = cheerio.load(`<root>${html}</root>`, null, false)
  const root = $('root')

  // Walk all descendants depth-first. For disallowed tags, unwrap (keep text
  // children) UNLESS the tag is <script>/<style>/<iframe> where we drop the
  // subtree entirely.
  const DROP_SUBTREE = new Set(['script', 'style', 'iframe', 'form', 'svg'])

  function visit(node: cheerio.Cheerio<cheerio.AnyNode>) {
    node.contents().each((_, el) => {
      // cheerio uses node types 'tag' for normal elements but 'script'/'style'
      // for those two specifically. Treat anything with a tagName as an
      // element so DROP_SUBTREE catches <script>/<style>.
      if (!('tagName' in el) || !el.tagName) return
      const $el = $(el)
      const tag = el.tagName.toLowerCase()

      if (DROP_SUBTREE.has(tag)) {
        $el.remove()
        return
      }

      if (!ALLOWED_TAGS.has(tag)) {
        // Unwrap: replace the element with its children
        $el.replaceWith($el.contents())
        return
      }

      // Allowed tag — strip disallowed attributes
      const allowed = ALLOWED_ATTRS_PER_TAG[tag] ?? new Set<string>()
      const attribs = { ...el.attribs }
      for (const name of Object.keys(attribs)) {
        if (!allowed.has(name)) {
          $el.removeAttr(name)
        }
      }

      // Per-attribute validation
      if (tag === 'a') {
        const href = $el.attr('href')
        if (href) {
          const safe = rewriteHref(href)
          if (safe) $el.attr('href', safe)
          else $el.removeAttr('href')
        }
      }
      if (tag === 'img') {
        const src = $el.attr('src')
        const safe = src ? rewriteImgSrc(src) : null
        if (!safe) {
          $el.remove()
          return
        }
        $el.attr('src', safe)
      }

      // Recurse into children of allowed tags
      visit($el)
    })
  }

  visit(root)
  return root.html() ?? ''
}
