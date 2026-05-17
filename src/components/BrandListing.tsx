'use client'
import { useMemo, useState } from 'react'
import type { Product, Ingredient } from '@/data/types'
import ProductCard from './ProductCard'

const INGREDIENTS_VISIBLE = 11
const PAGE_SIZE = 24

export default function BrandListing({
  brandName,
  products,
  ingredients,
}: {
  brandName: string
  products: Product[]
  ingredients: Ingredient[]
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [query, setQuery] = useState('')
  const [showAll, setShowAll] = useState(false)
  const [page, setPage] = useState(1)

  function toggleIngredient(name: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
    setPage(1)
  }

  function reset() {
    setSelected(new Set())
    setQuery('')
    setPage(1)
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return products.filter(p => {
      if (q && !p.name.toLowerCase().includes(q)) return false
      if (selected.size > 0) {
        // products without a known ingredient stay visible
        if (p.ingredient && !selected.has(p.ingredient)) return false
        if (!p.ingredient) return true
      }
      return true
    })
  }, [products, query, selected])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const current = Math.min(page, pageCount)
  const pageItems = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)

  const visibleIngredients = showAll ? ingredients : ingredients.slice(0, INGREDIENTS_VISIBLE)

  return (
    <div className="row">
      <aside id="filterSidebar" className="sidebar mobile-sidebar col-lg-3">
        <div className="sidebar-wrapper sticky-sidebar">
          <div className="filter filter-categories">
            <div className="filter__header"><h5>Ingredients</h5></div>
            <ul className="filter__list" id="ingredient_list">
              {visibleIngredients.map(ing => {
                const active = selected.has(ing.name)
                return (
                  <li className="filter__item" key={ing.id} data-count={ing.count}>
                    <a
                      className="filter__link"
                      title={ing.name}
                      href="#"
                      onClick={e => { e.preventDefault(); toggleIngredient(ing.name) }}
                      aria-pressed={active}
                    >
                      <span className={`filter-checkbox${active ? ' checked' : ''}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                          <path fill="none" stroke="currentColor" strokeWidth="3" d="M1.73 12.91l6.37 6.37L22.79 4.59" />
                        </svg>
                      </span>
                      <span className="filter-name">{ing.name}</span>
                    </a>
                  </li>
                )
              })}
              {ingredients.length > INGREDIENTS_VISIBLE && (
                <li className="filter__expand">
                  <a
                    className="filter__expand--button"
                    href="#"
                    onClick={e => { e.preventDefault(); setShowAll(s => !s) }}
                  >
                    {showAll ? 'See Less' : 'See More'} <i className="fal fa-chevron-down" />
                  </a>
                </li>
              )}
            </ul>
          </div>

          <div className="filter filter-search mt-3">
            <div className="filter__header"><h5>Search</h5></div>
            <input
              className="form-control"
              type="search"
              placeholder="Search products"
              value={query}
              onChange={e => { setQuery(e.target.value); setPage(1) }}
            />
          </div>

          <a
            href="#"
            className="reset-filter"
            title="Reset filter"
            onClick={e => { e.preventDefault(); reset() }}
          >
            <i className="icon-close" /> Reset filter
          </a>
        </div>
      </aside>

      <div className="col-lg-9 order-1 order-lg-2">
        <h2 className="category-title">{brandName}</h2>

        {pageItems.length === 0 ? (
          <p className="text-muted">No products match your filter.</p>
        ) : (
          <div className="products-listing">
            {pageItems.map(p => <ProductCard key={p.slug} product={p} />)}
          </div>
        )}

        {pageCount > 1 && (
          <nav className="toolbox toolbox-pagination">
            <ul className="pagination toolbox-item">
              {Array.from({ length: pageCount }, (_, i) => i + 1).map(n => (
                <li key={n} className={`page-item${n === current ? ' active' : ''}`}>
                  {n === current ? (
                    <span className="page-link">{n}</span>
                  ) : (
                    <a
                      className="page-link"
                      href="#"
                      onClick={e => { e.preventDefault(); setPage(n) }}
                    >
                      {n}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>
    </div>
  )
}
