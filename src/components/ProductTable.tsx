'use client'
// Shared listing UI for /catalog/, /brands/[slug]/, /categories/[slug]/.
//
// Architecture: React owns the input controls (search, sort, label & ingredient
// chips) because our predicates are structured and don't map cleanly to a
// single column filter. The derived array is then fed to TanStack Table,
// which owns pagination state. This gives us the Table abstraction's lifecycle
// (page index, page size, row model) without fighting it for filter semantics.

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  createColumnHelper,
} from '@tanstack/react-table'
import type { Product, Ingredient } from '@/data/types'
import ProductCard from './ProductCard'
import { QuickViewProvider } from '@/context/QuickViewContext'
import {
  productMatches,
  compareProducts,
  SORT_OPTIONS,
  EMPTY_LABEL_FILTERS,
  type LabelFilters,
  type SortKey,
} from '@/lib/productTable.helper'

const DEFAULT_PAGE_SIZE = 24

const columnHelper = createColumnHelper<Product>()
// One synthetic column — we render via grid cells, not <td>s, but TanStack
// still wants a column definition to build the row model.
const columns = [columnHelper.accessor((p) => p.slug, { id: 'product' })]

export interface ProductTableProps {
  products: Product[]
  ingredients?: Ingredient[]
  title?: string
  emptyMessage?: string
  pageSize?: number
}

export default function ProductTable({
  products,
  ingredients,
  title,
  emptyMessage = 'No products match your filters.',
  pageSize = DEFAULT_PAGE_SIZE,
}: ProductTableProps) {
  const [search, setSearch] = useState('')
  const [labels, setLabels] = useState<LabelFilters>(EMPTY_LABEL_FILTERS)
  const [ingSet, setIngSet] = useState<Set<string>>(new Set())
  const [sortKey, setSortKey] = useState<SortKey>('name-asc')

  useEffect(() => {
    const query = new URLSearchParams(window.location.search).get('q')
    if (query) setSearch(query)
  }, [])

  const filtered = useMemo(() => {
    return products
      .filter((p) => productMatches(p, { search, labels, ingredients: ingSet }))
      .sort((a, b) => compareProducts(a, b, sortKey))
  }, [products, search, labels, ingSet, sortKey])

  const table = useReactTable({
    data: filtered,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize, pageIndex: 0 } },
    // Reset page index when filters change (keep deps tight to filtered identity)
    autoResetPageIndex: true,
  })

  const pageRows = table.getRowModel().rows
  const pageCount = table.getPageCount() || 1
  const pageIndex = table.getState().pagination.pageIndex
  const total = filtered.length
  const grandTotal = products.length

  const toggleLabel = useCallback((name: keyof LabelFilters) => {
    setLabels((prev) => ({ ...prev, [name]: !prev[name] }))
  }, [])
  const toggleIngredient = useCallback((name: string) => {
    setIngSet((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }, [])
  const reset = useCallback(() => {
    setSearch('')
    setLabels(EMPTY_LABEL_FILTERS)
    setIngSet(new Set())
    setSortKey('name-asc')
  }, [])

  const anyChipActive = labels.new || labels.sale || ingSet.size > 0 || search.length > 0

  return (
    <QuickViewProvider>
    <section className="ngc-list" aria-label={title || 'Products listing'}>
      {title && <h1 className="ngc-list__title">{title}</h1>}

      <div className="ngc-toolbar" role="region" aria-label="Filter and sort">
        <label className="ngc-toolbar__search">
          <span className="visually-hidden">Search products</span>
          <input
            type="search"
            placeholder="Search products…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ngc-input"
            data-testid="product-search"
          />
        </label>

        <label className="ngc-toolbar__sort">
          <span className="visually-hidden">Sort by</span>
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="ngc-input"
            data-testid="product-sort"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </label>

        <div className="ngc-toolbar__chips" role="group" aria-label="Label filters">
          <button
            type="button"
            className={`ngc-chip${labels.new ? ' is-active' : ''}`}
            onClick={() => toggleLabel('new')}
            aria-pressed={labels.new ? 'true' : 'false'}
          >
            NEW
          </button>
          <button
            type="button"
            className={`ngc-chip${labels.sale ? ' is-active' : ''}`}
            onClick={() => toggleLabel('sale')}
            aria-pressed={labels.sale ? 'true' : 'false'}
          >
            SALE
          </button>
        </div>

        {anyChipActive && (
          <button type="button" className="ngc-toolbar__reset" onClick={reset}>
            Reset filters
          </button>
        )}
      </div>

      {ingredients && ingredients.length > 0 && (
        <div className="ngc-ingredients" role="group" aria-label="Ingredient filters">
          {ingredients.map((ing) => {
            const active = ingSet.has(ing.name)
            return (
              <button
                key={ing.id}
                type="button"
                className={`ngc-chip ngc-chip--ingredient${active ? ' is-active' : ''}`}
                onClick={() => toggleIngredient(ing.name)}
                aria-pressed={active ? 'true' : 'false'}
                title={`${ing.name} (${ing.count})`}
              >
                {ing.name} <span className="ngc-chip__count">{ing.count}</span>
              </button>
            )
          })}
        </div>
      )}

      <div className="ngc-list__meta" aria-live="polite">
        Showing <strong>{pageRows.length}</strong> of <strong>{total}</strong>
        {total !== grandTotal && (
          <> · <button type="button" className="ngc-link" onClick={reset}>clear filters</button> to see all {grandTotal}</>
        )}
      </div>

      {pageRows.length === 0 ? (
        <p className="ngc-list__empty">{emptyMessage}</p>
      ) : (
        <div className="products-grid" data-testid="product-grid">
          {pageRows.map((row) => (
            <ProductCard key={row.original.slug} product={row.original} />
          ))}
        </div>
      )}

      {pageCount > 1 && (
        <nav className="ngc-pagination" aria-label="Pagination">
          <button
            type="button"
            className="ngc-pagination__btn"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            aria-label="Previous page"
          >‹</button>
          {Array.from({ length: pageCount }, (_, i) => i).map((i) => (
            <button
              key={i}
              type="button"
              className={`ngc-pagination__num${i === pageIndex ? ' is-active' : ''}`}
              onClick={() => table.setPageIndex(i)}
              aria-current={i === pageIndex ? 'page' : undefined}
            >
              {i + 1}
            </button>
          ))}
          <button
            type="button"
            className="ngc-pagination__btn"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            aria-label="Next page"
          >›</button>
        </nav>
      )}
    </section>
    </QuickViewProvider>
  )
}
