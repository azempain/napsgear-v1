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
  const tiers = packTiers(parsePrice(product.price), product.packs)
  const [selected, setSelected] = useState(0)
  const [toast, setToast] = useState(false)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
  }, [])

  const reviews = product.reviews ?? pseudoCount(product.slug + ':reviews')
  const imagesCount = product.imagesCount ?? pseudoCount(product.slug + ':images')
  const qa = product.qaCount ?? pseudoCount(product.slug + ':qa')

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
    <>
      <div className={`notification${toast ? ' visible' : ''}`} aria-live="polite">
        <section className="body">
          <span className="title">Success</span>
          <p className="message">Item added to cart</p>
        </section>
      </div>

      <div className="product-single-container product-single-default">
        <div className="row">
          <div className="product-single-gallery col-lg-5 col-md-6 position-relative">
            <div className="product-item-image">
              <div className="product-single-image">
                {product.images[0] && (
                  <img alt={product.name} className="img-fluid" src={product.images[0]} />
                )}
              </div>
              <div className="label-group" />
            </div>
          </div>

          <div className="product-single-details col-lg-7 col-md-6">
            <h1 className="product-title">{product.name}</h1>

            <div className="ratings-container">
              <span className="rating-link">
                <span className="count">({reviews}</span> reviews)
              </span>
            </div>
            <hr className="short-divider" />

            <ul className="product-single-specifications">
              {product.brand && (
                <li><span className="label">Manufacturer:</span> {product.brand}</li>
              )}
              {product.ingredient && (
                <li><span className="label">Pharmaceutical name:</span> {product.ingredient}</li>
              )}
            </ul>
            <hr className="divider mt-0 mb-3" />

            <div className="product-multipliers">
              <div className="product-multipliers__header">
                <div>Pack:</div>
                <div className="text-center">Price per item:</div>
                <div className="text-center">Total:</div>
              </div>
              <div className="product-multipliers__content">
                {tiers.map((t, i) => (
                  <div className="product-multipliers__item" key={`${t.packs}-${i}`}>
                    <input
                      type="radio"
                      id={`pack_${t.packs}_${i}`}
                      name="pack"
                      checked={selected === i}
                      onChange={() => setSelected(i)}
                    />
                    <label htmlFor={`pack_${t.packs}_${i}`} className="product-multipliers__item--info">
                      <div className="quantity">
                        {t.packs} pack{t.packs > 1 ? 's' : ''}{t.label ? `  (${t.label})` : ''}
                      </div>
                      <div className="price-per-item" data-label="Price per item">
                        ${t.perItem.toFixed(2)}
                      </div>
                      <div className="price-total" data-label="Total">${t.total.toFixed(2)}</div>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="product-action product-item-shop">
              <button
                className="btn btn-dark add-cart shopping-cart product-item-shop"
                type="button"
                id="addToCartBtn"
                onClick={handleAdd}
              >
                Add to Cart
              </button>
            </div>

            <hr className="divider mb-5 mt-0" />

            {FREE_PACK_BANNERS.map(b => (
              <div className="product-promo-banner-block" key={b.free}>
                <div className="product-promo-banner">
                  <div className="promo-bonus">
                    <span>{b.free}&nbsp;</span><span>free</span>
                  </div>
                  <div className="promo-info" style={{ textAlign: 'center' }}>{b.text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div id="productTabs" className="product-single-tabs">
          <ul className="nav nav-tabs">
            <li className="nav-item active">
              <span className="nav-link active">Description</span>
            </li>
            <li className="nav-item">
              <span className="nav-link disabled">Customer Images: ({imagesCount})</span>
            </li>
            <li className="nav-item">
              <span className="nav-link disabled">Customer Questions &amp; Answers: {qa}</span>
            </li>
            <li className="nav-item">
              <span className="nav-link nav-link-reviews disabled">Reviews: {reviews}</span>
            </li>
          </ul>
          <div className="tab-content" id="productContent">
            <div className="tab-pane active" id="description">
              <p style={{ whiteSpace: 'pre-line' }}>
                {product.description || 'No description available.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
