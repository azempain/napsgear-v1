import { describe, it, expect } from 'vitest'
import { parsePrice, packTiers } from './pricing'
import type { PackTier } from '@/data/types'

describe('parsePrice', () => {
  it('parses euro', () => { expect(parsePrice('€52.73')).toBe(52.73) })
  it('parses dollar', () => { expect(parsePrice('$30')).toBe(30) })
  it('strips thousands commas', () => { expect(parsePrice('$1,234.50')).toBe(1234.5) })
  it('undefined -> 0', () => { expect(parsePrice(undefined)).toBe(0) })
  it('garbage -> 0', () => { expect(parsePrice('n/a')).toBe(0) })
})

describe('packTiers', () => {
  const t = packTiers(30)
  it('has 5 tiers for 1/5/10/15/20 packs', () => {
    expect(t.map(x => x.packs)).toEqual([1, 5, 10, 15, 20])
  })
  it('tier 1 is base price', () => {
    expect(t[0]).toEqual({ packs: 1, perItem: 30, total: 30 })
  })
  it('applies the volume-discount curve (per item)', () => {
    expect(t.map(x => x.perItem)).toEqual([30, 28.59, 27, 25.53, 24])
  })
  it('total = perItem * packs, rounded to 2dp', () => {
    expect(t[1].total).toBe(142.95)   // 28.59 * 5
    expect(t[4].total).toBe(480)      // 24 * 20
  })
  it('base 0 -> all zeros', () => {
    expect(packTiers(0).every(x => x.perItem === 0 && x.total === 0)).toBe(true)
  })
})

describe('packTiers real-data passthrough', () => {
  it('returns captured packs verbatim when provided', () => {
    const real: PackTier[] = [
      { packs: 1, label: '50 tabs (20mg/tab)', perItem: 30, total: 30 },
      { packs: 5, label: '250 tabs (20mg/tab)', perItem: 28.6, total: 143 },
    ]
    expect(packTiers(999, real)).toBe(real)
  })
  it('synthesizes when no packs given (unchanged behavior)', () => {
    const t = packTiers(30)
    expect(t).toHaveLength(5)
    expect(t[0]).toEqual({ packs: 1, perItem: 30, total: 30 })
  })
  it('synthesizes when packs is empty', () => {
    expect(packTiers(30, [])).toHaveLength(5)
  })
})
