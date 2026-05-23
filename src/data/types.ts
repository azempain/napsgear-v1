export interface Brand {
  slug: string | null
  name: string
  id: number | null
  url: string
  /** Optional brand bio HTML (sanitized via scripts/extract/lib/sanitize) */
  bioHtml?: string
}

export interface Category {
  slug: string
  name: string
  url: string
  /** When present, /categories/[slug]/ filters products to this list.
   *  Absent = fallback to showing the full catalog. */
  productSlugs?: string[]
}

export interface Video {
  url: string
  title: string
  date: string
  thumbnail: string
  isPremiere?: boolean
  premiereDate?: string
  description?: string
}

export interface PackTier {
  packs: number
  label?: string        // e.g. "50 tabs (20mg/tab)" — present only for real captured data
  perItem: number
  total: number
}

export interface Review {
  rating: number   // 1–5
  author: string
  date: string
  body: string
}

export interface QAItem {
  author: string
  date: string
  question: string
}

export interface Product {
  slug: string
  name: string
  description: string
  images: string[]
  price?: string
  brand?: string
  ingredient?: string
  labels?: { new?: boolean; sale?: string }
  reviews?: Review[]
  qa?: QAItem[]
  packs?: PackTier[]
}

export interface QaPost {
  id: string
  date: string
  text: string
  url: string
  category?: string
  author?: string
}

export interface Gearpic {
  id: string
  date: string
  title: string
  thumb: string
}

export interface Ingredient {
  id: number
  name: string
  count: number
  brand: string
}

// ─── Content types (populated by scripts/extract/) ──────────────────────────

export interface FaqEntry {
  id: string
  question: string
  /** Optional — full answer body when extracted. The current saved FAQ index
   *  links to NapsHelp articles rather than inlining answers, so this is
   *  often absent in favor of `sourceUrl`. */
  answer?: string
  category?: string
  /** External URL where the full answer lives (typically a NapsHelp article). */
  sourceUrl?: string
}

export interface ShippingDoc {
  sections: Array<{
    heading: string
    paras?: string[]
    list?: string[]
  }>
}

export interface Promotion {
  id: string
  title: string
  body: string
  cta?: { label: string; href: string }
  image?: string
  validUntil?: string
}

export interface DiaryEntry {
  slug: string
  title: string
  author?: string
  date: string
  excerpt: string
  /** Sanitized HTML — see scripts/extract/lib/sanitize.ts. The /aas-diaries/[slug]/
   *  renderer is the one place dangerouslySetInnerHTML is allowed in the codebase. */
  bodyHtml: string
}

export interface AffiliateDoc {
  heading: string
  intro: string
  sections: Array<{ heading: string; paras: string[] }>
  cta?: { label: string; href: string }
}

export interface ContactInfo {
  /** Optional — saved Contact page is currently a NapsHelp portal without an
   *  inline email. May be populated by hand if we later need it. */
  email?: string
  phone?: string
  address?: string
  hours?: string
  /** URL the support form on the saved page posts to. */
  formAction?: string
  /** Optional heading text from the saved page ("Welcome to NapsGear Support"). */
  heading?: string
  /** Optional URL to the external support portal (NapsHelp). */
  portalUrl?: string
}
