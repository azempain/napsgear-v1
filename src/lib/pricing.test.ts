import { describe, it, expect } from 'vitest'
import { parsePrice, packTiers, pseudoCount } from './pricing'

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

describe('pseudoCount', () => {
  it('is deterministic for the same seed', () => {
    expect(pseudoCount('foo')).toBe(pseudoCount('foo'))
  })
  it('differs by seed', () => {
    expect(pseudoCount('a:reviews')).not.toBe(pseudoCount('a:images'))
  })
  it('is within 8..140', () => {
    for (const s of ['x', 'y-z-p23665', 'altamofen', '']) {
      const n = pseudoCount(s)
      expect(n).toBeGreaterThanOrEqual(8)
      expect(n).toBeLessThanOrEqual(140)
    }
  })
})
