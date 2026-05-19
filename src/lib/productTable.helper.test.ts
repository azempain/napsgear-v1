import { describe, it, expect } from 'vitest'
import type { Product } from '@/data/types'
import {
  matchesSearch,
  matchesLabels,
  matchesIngredients,
  productMatches,
  compareProducts,
  EMPTY_LABEL_FILTERS,
} from './productTable.helper'

const make = (over: Partial<Product>): Product => ({
  slug: 'p', name: 'Generic', description: '', images: [], ...over,
})

describe('matchesSearch', () => {
  it('empty query matches everything', () => {
    expect(matchesSearch(make({ name: 'Anything' }), '')).toBe(true)
    expect(matchesSearch(make({ name: 'Anything' }), '   ')).toBe(true)
  })
  it('case-insensitive substring on name', () => {
    expect(matchesSearch(make({ name: 'Altamofen' }), 'tamo')).toBe(true)
    expect(matchesSearch(make({ name: 'Altamofen' }), 'TAMO')).toBe(true)
    expect(matchesSearch(make({ name: 'Altamofen' }), 'xyz')).toBe(false)
  })
})

describe('matchesLabels', () => {
  it('no requested labels matches everything', () => {
    expect(matchesLabels(make({}), EMPTY_LABEL_FILTERS)).toBe(true)
  })
  it('new requested -> product must have labels.new', () => {
    expect(matchesLabels(make({ labels: { new: true } }), { new: true, sale: false })).toBe(true)
    expect(matchesLabels(make({}), { new: true, sale: false })).toBe(false)
  })
  it('sale requested -> product must have labels.sale', () => {
    expect(matchesLabels(make({ labels: { sale: '20%' } }), { new: false, sale: true })).toBe(true)
    expect(matchesLabels(make({}), { new: false, sale: true })).toBe(false)
  })
  it('AND across labels', () => {
    const both = make({ labels: { new: true, sale: '10%' } })
    expect(matchesLabels(both, { new: true, sale: true })).toBe(true)
    expect(matchesLabels(make({ labels: { new: true } }), { new: true, sale: true })).toBe(false)
  })
})

describe('matchesIngredients', () => {
  it('empty set = no filter', () => {
    expect(matchesIngredients(make({ ingredient: 'Tamoxifen' }), new Set())).toBe(true)
  })
  it('product without ingredient stays visible (matches legacy BrandListing)', () => {
    expect(matchesIngredients(make({}), new Set(['Tamoxifen']))).toBe(true)
  })
  it('filters when product has an ingredient not in the set', () => {
    expect(matchesIngredients(make({ ingredient: 'Other' }), new Set(['Tamoxifen']))).toBe(false)
  })
  it('keeps when product ingredient is in the set', () => {
    expect(matchesIngredients(make({ ingredient: 'Tamoxifen' }), new Set(['Tamoxifen']))).toBe(true)
  })
})

describe('productMatches (combined)', () => {
  it('all predicates must pass', () => {
    const p = make({ name: 'Altamofen', ingredient: 'Tamoxifen', labels: { sale: '20%' } })
    expect(productMatches(p, {
      search: 'tamo',
      labels: { new: false, sale: true },
      ingredients: new Set(['Tamoxifen']),
    })).toBe(true)
    // search fails
    expect(productMatches(p, {
      search: 'xyz',
      labels: { new: false, sale: true },
      ingredients: new Set(['Tamoxifen']),
    })).toBe(false)
    // label fails
    expect(productMatches(p, {
      search: 'tamo',
      labels: { new: true, sale: false },
      ingredients: new Set(['Tamoxifen']),
    })).toBe(false)
  })
})

describe('compareProducts', () => {
  const apple   = make({ name: 'Apple',   price: '$10' })
  const banana  = make({ name: 'Banana',  price: '$5'  })
  const cherry  = make({ name: 'Cherry',  price: '$5'  })
  const noPrice = make({ name: 'Daiquiri' /* no price */ })

  it('name asc / desc', () => {
    expect([apple, banana, cherry].slice().sort((a, b) => compareProducts(a, b, 'name-asc')))
      .toEqual([apple, banana, cherry])
    expect([apple, banana, cherry].slice().sort((a, b) => compareProducts(a, b, 'name-desc')))
      .toEqual([cherry, banana, apple])
  })
  it('price asc puts cheapest first, name breaks ties', () => {
    const sorted = [apple, banana, cherry].slice().sort((a, b) => compareProducts(a, b, 'price-asc'))
    expect(sorted.map(p => p.name)).toEqual(['Banana', 'Cherry', 'Apple'])
  })
  it('price desc puts priciest first', () => {
    const sorted = [apple, banana, cherry].slice().sort((a, b) => compareProducts(a, b, 'price-desc'))
    expect(sorted.map(p => p.name)).toEqual(['Apple', 'Banana', 'Cherry'])
  })
  it('products with no price sort to the END on both price directions', () => {
    const asc  = [apple, noPrice, banana].slice().sort((a, b) => compareProducts(a, b, 'price-asc'))
    expect(asc.map(p => p.name)).toEqual(['Banana', 'Apple', 'Daiquiri'])
    const desc = [apple, noPrice, banana].slice().sort((a, b) => compareProducts(a, b, 'price-desc'))
    expect(desc.map(p => p.name)).toEqual(['Apple', 'Banana', 'Daiquiri'])
  })
})
