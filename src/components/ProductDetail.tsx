'use client'
import { useState, useRef, useEffect } from 'react'
import type { Product } from '@/data/types'
import { useCart } from '@/context/CartContext'
import { parsePrice, packTiers, pseudoCount } from '@/lib/pricing'

const FREE_PACK_BANNERS = [
  { free: '1 pack', text: 'For every 5 packs purchased, you get 1 pack FREE' },
  { free: '2 packs', text: 'For every 10 packs purchased, you get 2 packs FREE' },
  { free: '3 packs', text: 'For every 15 packs purchased, you get 3 packs FREE' },
  { free: '4 packs', text: 'For every 20 packs purchased, you get 4 packs FREE' },
]

export default function ProductDetail({ product }: { product: Product }) {
  const { addItem } = useCart()
  const tiers = packTiers(parsePrice(product.price))
  const [selected, setSelected] = useState(0)
  const [toast, setToast] = useState(false)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
  }, [])

  const reviews = pseudoCount(product.slug + ':reviews')
  const images = pseudoCount(product.slug + ':images')
  const qa = pseudoCount(product.slug + ':qa')

  function handleAdd() {
    const tier = tiers[selected]
    addItem({
      id: `${product.slug}__${tier.packs}`,
      name: `${product.name} — ${tier.packs} pack${tier.packs > 1 ? 's' : ''}`,
      price: tier.total,
      qty: 1,
      image: product.images[0],
      brand: product.brand,
    })
    setToast(true)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(false), 2500)
  }

  return (
    <div className="product-detail">
      <div className={`notification${toast ? ' visible' : ''}`} aria-live="polite">
        <section className="body">
          <span className="title">Success</span>
          <p className="message">Item added to cart</p>
        </section>
      </div>

      <div className="row g-4">
        <div className="col-md-5">
          {product.images[0] && (
            <img
              src={product.images[0]}
              alt={product.name}
              className="img-fluid rounded border product-image"
              referrerPolicy="no-referrer"
            />
          )}
        </div>

        <div className="col-md-7">
          <h1 className="mb-1">{product.name}</h1>
          <p className="text-muted mb-3">({reviews} reviews)</p>
          {product.brand && (
            <p className="mb-3"><strong>Manufacturer:</strong> {product.brand}</p>
          )}

          <fieldset className="pack-selector mb-3">
            <legend className="h6">Pack:</legend>
            {tiers.map((t, i) => (
              <label key={t.packs} className="pack-option d-flex justify-content-between align-items-center border rounded p-2 mb-2">
                <span>
                  <input
                    type="radio"
                    name="pack"
                    className="me-2"
                    checked={selected === i}
                    onChange={() => setSelected(i)}
                  />
                  {t.packs} pack{t.packs > 1 ? 's' : ''}
                </span>
                <span className="text-muted">${t.perItem.toFixed(2)} / item</span>
                <span className="fw-bold" data-tier-total>${t.total.toFixed(2)}</span>
              </label>
            ))}
          </fieldset>

          <button
            type="button"
            className="btn btn-primary"
            id="addToCartBtn"
            onClick={handleAdd}
          >
            Add to Cart
          </button>

          <div className="free-pack-banners mt-4">
            {FREE_PACK_BANNERS.map(b => (
              <div key={b.free} className="free-pack-banner d-flex align-items-center mb-2">
                <span className="free-pack-badge">{b.free} <small>FREE</small></span>
                <span className="ms-2">{b.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="product-tabs mt-5">
        <ul className="nav nav-tabs" role="tablist">
          <li className="nav-item"><span className="nav-link active">Description</span></li>
          <li className="nav-item"><span className="nav-link disabled">Customer Images ({images})</span></li>
          <li className="nav-item"><span className="nav-link disabled">Customer Q&amp;A ({qa})</span></li>
          <li className="nav-item"><span className="nav-link disabled">Reviews ({reviews})</span></li>
        </ul>
        <div className="tab-content p-3 border border-top-0">
          <p style={{ whiteSpace: 'pre-line' }}>{product.description || 'No description available.'}</p>
        </div>
      </div>
    </div>
  )
}
