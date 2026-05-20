import type { MetadataRoute } from 'next'
import { products, brands, categories } from '@/data'
import { SITE_URL, STATIC_ROUTES } from '@/lib/site'

// Required by Next 16 + output: 'export' so the route is emitted as a
// literal file at build time instead of a runtime handler.
export const dynamic = 'force-static'

/** Build-time sitemap covering every indexable static + dynamic route.
 *  Next.js writes the result to /sitemap.xml; for `output: 'export'` it's a
 *  literal file under out/ — no server hit at runtime. */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  const entries: MetadataRoute.Sitemap = []

  for (const { path, priority, changeFreq } of STATIC_ROUTES) {
    entries.push({
      url: `${SITE_URL}${path}`,
      lastModified: now,
      changeFrequency: changeFreq,
      priority,
    })
  }

  for (const p of products) {
    entries.push({
      url: `${SITE_URL}/${p.slug}/`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    })
  }

  for (const b of brands) {
    if (!b.slug) continue
    entries.push({
      url: `${SITE_URL}/brands/${b.slug}/`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    })
  }

  for (const c of categories) {
    entries.push({
      url: `${SITE_URL}/categories/${c.slug}/`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    })
  }

  return entries
}
