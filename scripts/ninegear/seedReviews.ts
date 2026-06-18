// ⚠️ SYNTHETIC / FABRICATED CONTENT.
// ninegear.us exposes zero reviews. This generator deterministically
// invents plausible reviews + Q&A, seeded from the product slug, so the
// storefront looks populated and builds are byte-for-byte reproducible.
// This is NOT real customer data. Do not present it as such.
import type { Review, QAItem } from '../../src/data/types'

export interface DateWindow {
  startMs: number
  endMs: number
}

// FNV-1a 32-bit hash → numeric seed from the slug.
function hashSeed(str: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

// mulberry32 PRNG — tiny, fast, deterministic.
function mulberry32(seed: number): () => number {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const AUTHORS = [
  'Mike R.', 'Tony G.', 'Chris P.', 'Dave M.', 'Alex K.', 'Sam T.',
  'Jordan B.', 'Ryan H.', 'Luis A.', 'Marco D.', 'Kevin S.', 'Brandon L.',
  'Eddie V.', 'Nick C.', 'Paul W.', 'Derek F.',
]

const OPENERS = [
  'Great product,', 'Really happy with this,', 'Solid quality,',
  'Exactly what I expected,', 'Top notch,', 'No complaints here,',
  'Legit product,', 'Came through fast,',
]
const MIDDLES = [
  'shipping was quick and discreet.', 'packaging was on point.',
  'results showed up faster than I thought.', 'dosing felt accurate and consistent.',
  'exactly as described on the page.', 'will definitely be ordering again.',
  'customer service answered my questions fast.', 'tracking updated the same day.',
]
const CLOSERS = [
  'Highly recommend.', 'Five stars from me.', 'Would buy again.',
  'Trusted source.', 'Very satisfied.', 'Can\'t fault it.',
]

const QUESTIONS = [
  'How long does shipping usually take?',
  'Is this the real deal? Looking for an authentic source.',
  'What dosage do you recommend for a first cycle?',
  'Do you ship to all states?',
  'How should this be stored after opening?',
  'Can I stack this with other products from the same brand?',
]

function pick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)]
}

function pickRating(rng: () => number): number {
  const r = rng()
  if (r < 0.6) return 5
  if (r < 0.85) return 4
  if (r < 0.97) return 3
  return 2
}

function dateIn(rng: () => number, win: DateWindow): string {
  const t = win.startMs + Math.floor(rng() * (win.endMs - win.startMs))
  return new Date(t).toISOString().slice(0, 10)
}

export function seedReviews(
  slug: string,
  win: DateWindow,
): { reviews: Review[]; qa: QAItem[] } {
  const rng = mulberry32(hashSeed(slug))

  // ~12% of products get no reviews; rest get 1..7.
  const reviewCount = rng() < 0.12 ? 0 : 1 + Math.floor(rng() * 7)
  const reviews: Review[] = []
  for (let i = 0; i < reviewCount; i++) {
    reviews.push({
      rating: pickRating(rng),
      author: pick(rng, AUTHORS),
      date: dateIn(rng, win),
      body: `${pick(rng, OPENERS)} ${pick(rng, MIDDLES)} ${pick(rng, CLOSERS)}`,
    })
  }

  // 0..2 Q&A entries.
  const qaCount = Math.floor(rng() * 3)
  const qa: QAItem[] = []
  for (let i = 0; i < qaCount; i++) {
    qa.push({
      author: pick(rng, AUTHORS),
      date: dateIn(rng, win),
      question: pick(rng, QUESTIONS),
    })
  }

  return { reviews, qa }
}
