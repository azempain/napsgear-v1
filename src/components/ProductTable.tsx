'use client'
// Shared listing UI for /catalog/, /brands/[slug]/, /categories/[slug]/.
//
// Architecture: React owns the input controls (search, sort, label & ingredient
// chips) because our predicates are structured and don't map cleanly to a
// single column filter. The derived array is then fed to TanStack Table,
// which owns pagination state. This gives us the Table abstraction's lifecycle
// (page index, page size, row model) without fighting it for filter semantics.

import { useEffect, useMemo } from 'react'
import { useStore } from '@tanstack/react-store'
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
  type LabelFilters,
  type SortKey,
} from '@/lib/productTable.helper'
import { componentUiStore } from '@/store/componentUiStore'

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
  const { sourceKey, search, labels, ingredients: ingredientList, sortKey } = useStore(componentUiStore, state => state.productTable)
  const currentSourceKey = typeof window === 'undefined' ? sourceKey : `${window.location.pathname}${window.location.search}`
  const urlSearch = typeof window === 'undefined' ? '' : new URLSearchParams(window.location.search).get('q') ?? ''
  const searchValue = sourceKey === currentSourceKey ? search : urlSearch
  const ingSet = useMemo(() => new Set(ingredientList), [ingredientList])

  useEffect(() => {
    const sourceKey = `${window.location.pathname}${window.location.search}`
    const query = new URLSearchParams(window.location.search).get('q') ?? ''
    componentUiStore.actions.hydrateProductTable(sourceKey, query)
  })

  const filtered = useMemo(() => {
    return products
      .filter((p) => productMatches(p, { search: searchValue, labels, ingredients: ingSet }))
      .sort((a, b) => compareProducts(a, b, sortKey))
  }, [products, searchValue, labels, ingSet, sortKey])

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

  const toggleLabel = (name: keyof LabelFilters) => componentUiStore.actions.toggleProductLabel(name)
  const toggleIngredient = (name: string) => componentUiStore.actions.toggleProductIngredient(name)
  const reset = componentUiStore.actions.resetProductTable

  const anyChipActive = labels.new || labels.sale || ingSet.size > 0 || searchValue.length > 0

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
            value={searchValue}
            onChange={(e) => componentUiStore.actions.setProductSearch(e.target.value)}
            className="ngc-input"
            data-testid="product-search"
          />
        </label>

        <label className="ngc-toolbar__sort">
          <span className="visually-hidden">Sort by</span>
          <select
            value={sortKey}
            onChange={(e) => componentUiStore.actions.setProductSort(e.target.value as SortKey)}
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
