import type { Review } from '@/data/types'

export interface RatingSummary {
  average: number
  count: number
}

/** Average (1-decimal) + count for a product's reviews. Zeroes when none. */
export function ratingSummary(reviews?: Review[]): RatingSummary {
  const count = reviews?.length ?? 0
  if (!count) return { average: 0, count: 0 }
  const sum = reviews!.reduce((s, r) => s + r.rating, 0)
  return { average: Math.round((sum / count) * 10) / 10, count }
}
