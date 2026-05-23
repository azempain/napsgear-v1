import { describe, it, expect } from 'vitest'
import { deriveIngredients } from './ingredients'
import type { Product } from '@/data/types'

const PRODUCTS: Product[] = [
  { slug: 'a', name: 'A', description: '', images: [], brand: 'Alpha-Pharma', ingredient: 'Tamoxifen' },
  { slug: 'b', name: 'B', description: '', images: [], brand: 'Alpha-Pharma', ingredient: 'Tamoxifen' },
  { slug: 'c', name: 'C', description: '', images: [], brand: 'Alpha-Pharma', ingredient: 'Anastrozole' },
  { slug: 'd', name: 'D', description: '', images: [], brand: 'AvoGen Lab',   ingredient: 'Testosterone' },
  { slug: 'e', name: 'E', description: '', images: [] }, // no ingredient
]

describe('deriveIngredients', () => {
  const list = deriveIngredients(PRODUCTS)

  it('one entry per (brand, ingredient) pair', () => {
    expect(list).toHaveLength(3)
  })

  it('counts products per pair correctly', () => {
    const tamox = list.find(i => i.name === 'Tamoxifen' && i.brand === 'Alpha-Pharma')
    expect(tamox?.count).toBe(2)
  })

  it('skips products without an ingredient', () => {
    expect(list.find(i => i.brand === 'unknown')).toBeUndefined()
    // E has no ingredient so it's not represented
    expect(list.reduce((sum, i) => sum + i.count, 0)).toBe(4)
  })

  it('assigns stable ids derived from brand+ingredient', () => {
    const a = deriveIngredients(PRODUCTS).find(i => i.name === 'Tamoxifen')!
    const b = deriveIngredients(PRODUCTS).find(i => i.name === 'Tamoxifen')!
    expect(a.id).toBe(b.id)
  })
})
