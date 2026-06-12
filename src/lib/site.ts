// Shared site-wide constants used by sitemap, robots, and the JSON-LD
// emitters in route metadata. Keeping these in one file so the base URL,
// site name, and route inventory stay in sync.

/** Absolute origin without trailing slash. Set via NEXT_PUBLIC_SITE_URL in
 *  .env.local for local builds and via Vercel project env in production.
 *  Falls back to a placeholder so dev builds don't crash. */
export const SITE_URL: string = (
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://napsgear-v1.vercel.app'
).replace(/\/+$/, '')

export const SITE_NAME = 'NapsGear'
export const SITE_DESCRIPTION =
  'NapsGear — The largest marketplace for pharmaceuticals'

/** Compose an absolute URL for a path that may or may not have a leading slash. */
export function absoluteUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`
  return `${SITE_URL}${p}`
}

/** Top-level static routes that should appear in the sitemap.
 *  Order doesn't matter for the sitemap; this just keeps the list in
 *  one place so adding a new info page only touches one file. */
export const STATIC_ROUTES: { path: string; priority: number; changeFreq: 'weekly' | 'monthly' | 'yearly' }[] = [
  { path: '/',                       priority: 1.0, changeFreq: 'weekly' },
  { path: '/catalog/',               priority: 0.9, changeFreq: 'weekly' },
  { path: '/promotions/',            priority: 0.6, changeFreq: 'weekly' },
  { path: '/faq/',                   priority: 0.5, changeFreq: 'monthly' },
  { path: '/help/',                  priority: 0.4, changeFreq: 'monthly' },
  { path: '/contact-us/',            priority: 0.5, changeFreq: 'monthly' },
  { path: '/shipping-information/',  priority: 0.5, changeFreq: 'monthly' },
  { path: '/why-naps/',              priority: 0.5, changeFreq: 'monthly' },
  { path: '/references/',            priority: 0.4, changeFreq: 'yearly' },
  { path: '/ask-an-ifbb-pro/',       priority: 0.5, changeFreq: 'monthly' },
  { path: '/qa/',                    priority: 0.5, changeFreq: 'weekly' },
  { path: '/store-credit/',          priority: 0.4, changeFreq: 'monthly' },
  { path: '/reviews-for-cash/',      priority: 0.4, changeFreq: 'monthly' },
  { path: '/share-your-gear-pics/',  priority: 0.4, changeFreq: 'monthly' },
  { path: '/refer-a-friend/',        priority: 0.4, changeFreq: 'monthly' },
  { path: '/cashback/',              priority: 0.4, changeFreq: 'monthly' },
  { path: '/supplier-super-deals/',  priority: 0.5, changeFreq: 'weekly' },
  { path: '/product-of-the-week/',   priority: 0.6, changeFreq: 'weekly' },
  { path: '/laboratory-tests/',      priority: 0.5, changeFreq: 'monthly' },
  { path: '/project-get-shredded/',  priority: 0.4, changeFreq: 'monthly' },
  { path: '/community-gearpics/',    priority: 0.5, changeFreq: 'weekly' },
]

/** Routes that must NEVER be indexed (cart state, in-flight checkout). */
export const PRIVATE_ROUTES = [
  '/cart/',
  '/checkout/',
  '/account/',
  '/login/',
  '/signup/',
  '/forgot-password/',
  '/reset-password/',
]
