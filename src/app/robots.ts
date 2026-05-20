import type { MetadataRoute } from 'next'
import { SITE_URL, PRIVATE_ROUTES } from '@/lib/site'

// Required by Next 16 + output: 'export' so the route is emitted as a
// literal file at build time instead of a runtime handler.
export const dynamic = 'force-static'

/** robots.txt — allows crawlers everywhere except cart + checkout (which
 *  carry per-session state and shouldn't appear in SERPs). */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: PRIVATE_ROUTES,
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
