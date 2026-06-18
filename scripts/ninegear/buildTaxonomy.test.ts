import { describe, it, expect } from 'vitest'
import { buildTaxonomy } from './buildTaxonomy'

const ITEMS = [
  { slug: 'bpc-157-2', brand: 'Pharmaqo Labs', categories: [{ id: 156, name: 'Peptides', slug: 'peptides' }] },
  { slug: 'anavar-10', brand: undefined, categories: [{ id: 148, name: 'Anavar', slug: 'anavar' }] },
  { slug: 'anavar-50', brand: 'Pharmaqo Labs', categories: [{ id: 148, name: 'Anavar', slug: 'anavar' }] },
]

describe('buildTaxonomy', () => {
  it('builds one category per slug with its product slugs', () => {
    const { categories } = buildTaxonomy(ITEMS)
    const anavar = categories.find((c) => c.slug === 'anavar')!
    expect(anavar.name).toBe('Anavar')
    expect(anavar.url).toBe('/categories/anavar')
    expect(anavar.productSlugs).toEqual(['anavar-10', 'anavar-50'])
    expect(categories).toHaveLength(2)
  })

  it('builds distinct brands with matching name and kebab slug', () => {
    const { brands } = buildTaxonomy(ITEMS)
    expect(brands).toHaveLength(1)
    expect(brands[0]).toEqual({
      slug: 'pharmaqo-labs',
      name: 'Pharmaqo Labs',
      id: null,
      url: '/brands/pharmaqo-labs',
    })
  })
})
