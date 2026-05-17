import { describe, it, expect } from 'vitest'
import { brands, categories, videos, products, qaPosts, gearpics, ingredients } from './index'

describe('data layer', () => {
  it('brands is a non-empty array of Brand', () => {
    expect(Array.isArray(brands)).toBe(true)
    expect(brands.length).toBeGreaterThan(0)
    const b = brands[0]
    expect(typeof b.slug).toBe('string')
    expect(typeof b.name).toBe('string')
    expect(typeof b.url).toBe('string')
  })

  it('categories is a non-empty array of Category', () => {
    expect(Array.isArray(categories)).toBe(true)
    expect(categories.length).toBeGreaterThan(0)
    expect(typeof categories[0].slug).toBe('string')
  })

  it('videos is an array', () => {
    expect(Array.isArray(videos)).toBe(true)
  })

  it('products is an array (may be empty)', () => {
    expect(Array.isArray(products)).toBe(true)
  })
})

describe('qaPosts', () => {
  it('is a non-empty array of QaPost', () => {
    expect(Array.isArray(qaPosts)).toBe(true)
    expect(qaPosts.length).toBeGreaterThan(0)
    const p = qaPosts[0]
    expect(typeof p.id).toBe('string')
    expect(typeof p.date).toBe('string')
    expect(typeof p.text).toBe('string')
    expect(typeof p.url).toBe('string')
  })
})

describe('gearpics', () => {
  it('is a non-empty array of Gearpic', () => {
    expect(Array.isArray(gearpics)).toBe(true)
    expect(gearpics.length).toBeGreaterThan(0)
    const g = gearpics[0]
    expect(typeof g.id).toBe('string')
    expect(typeof g.date).toBe('string')
    expect(typeof g.title).toBe('string')
    expect(typeof g.thumb).toBe('string')
  })
})

describe('ingredients', () => {
  it('is an array (may be empty)', () => {
    expect(Array.isArray(ingredients)).toBe(true)
  })
  it('every row has id/name/count/brand when present', () => {
    for (const i of ingredients) {
      expect(typeof i.id).toBe('number')
      expect(typeof i.name).toBe('string')
      expect(typeof i.count).toBe('number')
      expect(typeof i.brand).toBe('string')
    }
  })
})
