import { describe, it, expect } from 'vitest'
import { seedReviews } from './seedReviews'

const WIN = { startMs: 1_704_067_200_000, endMs: 1_735_603_200_000 } // 2024-01-01 .. 2024-12-30

describe('seedReviews', () => {
  it('is deterministic for the same slug', () => {
    const a = seedReviews('bpc-157-2', WIN)
    const b = seedReviews('bpc-157-2', WIN)
    expect(a).toEqual(b)
  })

  it('produces different output for different slugs', () => {
    const a = JSON.stringify(seedReviews('anavar-10', WIN))
    const b = JSON.stringify(seedReviews('trenbolone-100', WIN))
    expect(a).not.toBe(b)
  })

  it('only emits ratings in 1..5 and dates inside the window', () => {
    for (const slug of ['a', 'bbb', 'c-1', 'winstrol-50', 'masteron']) {
      const { reviews } = seedReviews(slug, WIN)
      for (const r of reviews) {
        expect(r.rating).toBeGreaterThanOrEqual(1)
        expect(r.rating).toBeLessThanOrEqual(5)
        expect(r.author.length).toBeGreaterThan(0)
        expect(r.body.length).toBeGreaterThan(0)
        const t = Date.parse(r.date)
        expect(t).toBeGreaterThanOrEqual(WIN.startMs)
        expect(t).toBeLessThanOrEqual(WIN.endMs)
      }
    }
  })

  it('skews positive — average rating across many slugs is >= 4', () => {
    const ratings: number[] = []
    for (let i = 0; i < 200; i++) {
      seedReviews(`prod-${i}`, WIN).reviews.forEach((r) => ratings.push(r.rating))
    }
    const avg = ratings.reduce((s, n) => s + n, 0) / ratings.length
    expect(avg).toBeGreaterThanOrEqual(4)
  })
})
