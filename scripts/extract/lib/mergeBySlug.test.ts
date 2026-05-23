import { describe, it, expect } from 'vitest'
import { mergeBySlug } from './mergeBySlug'

interface Row { slug: string; name?: string; price?: string; brand?: string }

describe('mergeBySlug', () => {
  it('appends rows whose slug is not in existing', () => {
    const r = mergeBySlug<Row>(
      [{ slug: 'a', name: 'A' }],
      [{ slug: 'b', name: 'B' }],
    )
    expect(r.merged).toEqual([{ slug: 'a', name: 'A' }, { slug: 'b', name: 'B' }])
    expect(r.added).toBe(1)
    expect(r.updated).toBe(0)
    expect(r.unchanged).toBe(1)
  })

  it('updates existing rows by patching fields, leaving omitted fields intact', () => {
    const r = mergeBySlug<Row>(
      [{ slug: 'a', name: 'old', price: '$1', brand: 'Acme' }],
      [{ slug: 'a', name: 'new' }],
    )
    expect(r.merged).toEqual([{ slug: 'a', name: 'new', price: '$1', brand: 'Acme' }])
    expect(r.added).toBe(0)
    expect(r.updated).toBe(1)
    expect(r.unchanged).toBe(0)
  })

  it('counts unchanged when incoming row equals existing', () => {
    const r = mergeBySlug<Row>(
      [{ slug: 'a', name: 'X' }],
      [{ slug: 'a', name: 'X' }],
    )
    expect(r.updated).toBe(0)
    expect(r.unchanged).toBe(1)
  })

  it('mixed scenario: new + updated + unchanged in one call', () => {
    const r = mergeBySlug<Row>(
      [{ slug: 'a', name: 'A' }, { slug: 'b', name: 'B' }, { slug: 'c', name: 'C' }],
      [
        { slug: 'a', name: 'A' },        // unchanged
        { slug: 'b', name: 'B2' },       // updated
        { slug: 'd', name: 'D' },        // added
      ],
    )
    expect(r.added).toBe(1)
    expect(r.updated).toBe(1)
    expect(r.unchanged).toBe(2)
    expect(r.merged.map(x => x.slug).sort()).toEqual(['a', 'b', 'c', 'd'])
  })

  it('treats incoming undefined fields as "do not change"', () => {
    const r = mergeBySlug<Row>(
      [{ slug: 'a', name: 'X', price: '$1' }],
      [{ slug: 'a', name: undefined, price: '$2' }],
    )
    expect(r.merged[0]).toEqual({ slug: 'a', name: 'X', price: '$2' })
  })
})
