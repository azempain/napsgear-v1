import { describe, it, expect, beforeEach } from 'vitest'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { dropMissingImages, dedupeByBrandName } from './normalize'
import type { Product } from '@/data/types'

const make = (over: Partial<Product> & { slug: string; name: string }): Product => ({
  description: '', images: [], ...over,
})

describe('dedupeByBrandName', () => {
  it('keeps the entry with the longest description when duplicates collide', () => {
    const a = make({ slug: 'foo-pA', name: 'Foo', brand: 'Acme', description: 'short' })
    const b = make({ slug: 'foo-pB', name: 'Foo', brand: 'Acme', description: 'a much longer description than the other entry has' })
    const r = dedupeByBrandName([a, b])
    expect(r.kept).toHaveLength(1)
    expect(r.kept[0].slug).toBe('foo-pB')
    expect(r.removed).toBe(1)
  })

  it('preserves entries from different brands with the same name', () => {
    const a = make({ slug: 'foo-1', name: 'Foo', brand: 'Acme' })
    const b = make({ slug: 'foo-2', name: 'Foo', brand: 'Beta' })
    const r = dedupeByBrandName([a, b])
    expect(r.kept).toHaveLength(2)
    expect(r.removed).toBe(0)
  })

  it('merges packs from a duplicate when the keeper has none', () => {
    const a = make({
      slug: 'foo-pA', name: 'Foo', brand: 'Acme',
      description: 'rich description', // longer → kept
      packs: undefined,
    })
    const b = make({
      slug: 'foo-pB', name: 'Foo', brand: 'Acme',
      description: 'short',
      packs: [{ packs: 1, perItem: 10, total: 10 }],
    })
    const r = dedupeByBrandName([a, b])
    expect(r.kept[0].slug).toBe('foo-pA')
    expect(r.kept[0].packs).toEqual([{ packs: 1, perItem: 10, total: 10 }])
  })

  it('leaves products without a brand alone (no key to group on)', () => {
    const a = make({ slug: 'foo-1', name: 'Foo' })
    const b = make({ slug: 'foo-2', name: 'Foo' })
    const r = dedupeByBrandName([a, b])
    expect(r.kept).toHaveLength(2)
  })
})

describe('dropMissingImages', () => {
  let tmp: string
  beforeEach(async () => {
    tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'normalize-'))
    await fs.mkdir(path.join(tmp, 'images/products'), { recursive: true })
    await fs.writeFile(path.join(tmp, 'images/products/exists.jpg'), 'x')
  })

  it('keeps absolute URLs untouched (we cannot verify external)', async () => {
    const r = await dropMissingImages(
      [make({ slug: 'a', name: 'A', images: ['https://cdn.example/x.jpg'] })],
      tmp,
    )
    expect(r.products[0].images).toEqual(['https://cdn.example/x.jpg'])
    expect(r.brokenStripped).toBe(0)
  })

  it('keeps images that exist on disk', async () => {
    const r = await dropMissingImages(
      [make({ slug: 'a', name: 'A', images: ['/images/products/exists.jpg'] })],
      tmp,
    )
    expect(r.products[0].images).toEqual(['/images/products/exists.jpg'])
  })

  it('drops the entire images field when no path resolves on disk', async () => {
    const r = await dropMissingImages(
      [make({ slug: 'a', name: 'A', images: ['/images/products/ghost.jpg'] })],
      tmp,
    )
    expect(r.products[0].images).toEqual([])
    expect(r.brokenStripped).toBe(1)
  })

  it('keeps the subset that resolves when only some are missing', async () => {
    const r = await dropMissingImages(
      [make({ slug: 'a', name: 'A', images: ['/images/products/exists.jpg', '/images/products/ghost.jpg'] })],
      tmp,
    )
    expect(r.products[0].images).toEqual(['/images/products/exists.jpg'])
    expect(r.brokenStripped).toBe(1)
  })
})
