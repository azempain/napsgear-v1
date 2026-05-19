// Pure logic used by the <ProductTable> component. Lives outside the
// component so vitest can lock the contract in Node (no JSDOM).
//
// TanStack Table handles the state machine (sort, pagination, filter wiring);
// these helpers are the predicates and comparators it calls.

import type { Product } from '@/data/types'
import { parsePrice } from './pricing'

export interface LabelFilters {
  new: boolean
  sale: boolean
}

export const EMPTY_LABEL_FILTERS: LabelFilters = { new: false, sale: false }

export type SortKey = 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc'

/** Case-insensitive substring match on the product name. Empty query matches anything. */
export function matchesSearch(p: Product, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return p.name.toLowerCase().includes(q)
}

/** Label filter is AND across requested labels. No requested labels = no filter. */
export function matchesLabels(p: Product, want: LabelFilters): boolean {
  if (want.new && !p.labels?.new) return false
  if (want.sale && !p.labels?.sale) return false
  return true
}

/** Ingredient multi-select: empty set means "no filter". Products without an
 *  ingredient stay visible — matches the original BrandListing behavior so
 *  we don't accidentally hide catalog rows when a chip is selected. */
export function matchesIngredients(p: Product, selected: Set<string>): boolean {
  if (selected.size === 0) return true
  if (!p.ingredient) return true
  return selected.has(p.ingredient)
}

/** Combined predicate — what the table's globalFilter actually calls. */
export function productMatches(
  p: Product,
  state: { search: string; labels: LabelFilters; ingredients: Set<string> },
): boolean {
  return (
    matchesSearch(p, state.search) &&
    matchesLabels(p, state.labels) &&
    matchesIngredients(p, state.ingredients)
  )
}

/** Sort comparator. Products with no price sort to the end on price sorts. */
export function compareProducts(a: Product, b: Product, key: SortKey): number {
  switch (key) {
    case 'name-asc':  return a.name.localeCompare(b.name)
    case 'name-desc': return b.name.localeCompare(a.name)
    case 'price-asc':
    case 'price-desc': {
      const pa = parsePrice(a.price)
      const pb = parsePrice(b.price)
      // Priceless products tail the list in BOTH directions so a user sorting
      // by price never sees "$—" at the top of the page.
      const aMissing = pa <= 0
      const bMissing = pb <= 0
      if (aMissing && !bMissing) return 1
      if (!aMissing && bMissing) return -1
      if (aMissing && bMissing) return a.name.localeCompare(b.name)
      if (pa === pb) return a.name.localeCompare(b.name)
      return key === 'price-asc' ? pa - pb : pb - pa
    }
  }
}

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'name-asc',   label: 'Name (A → Z)' },
  { value: 'name-desc',  label: 'Name (Z → A)' },
  { value: 'price-asc',  label: 'Price (low → high)' },
  { value: 'price-desc', label: 'Price (high → low)' },
]
