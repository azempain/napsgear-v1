import { describe, it, expect } from 'vitest'
import { ratingSummary } from './reviews'
import type { Review } from '@/data/types'

const r = (rating: number): Review => ({ rating, author: 'x', date: '2024-01-01', body: 'b' })

describe('ratingSummary', () => {
  it('returns zeroes for undefined or empty', () => {
    expect(ratingSummary(undefined)).toEqual({ average: 0, count: 0 })
    expect(ratingSummary([])).toEqual({ average: 0, count: 0 })
  })

  it('counts reviews and averages ratings to 1 decimal', () => {
    expect(ratingSummary([r(5), r(4)])).toEqual({ average: 4.5, count: 2 })
    expect(ratingSummary([r(5), r(4), r(4)])).toEqual({ average: 4.3, count: 3 })
    expect(ratingSummary([r(5), r(5), r(5)])).toEqual({ average: 5, count: 3 })
  })
})
