'use client'
import { useRef, useEffect } from 'react'
import { useStore } from '@tanstack/react-store'
import type { Product } from '@/data/types'
import { useCart } from '@/context/CartContext'
import { parsePrice, packTiers } from '@/lib/pricing'
import { useCurrency } from '@/context/CurrencyContext'
import { componentUiStore } from '@/store/componentUiStore'

const FREE_PACK_BANNERS = [
  { free: '1 pack', text: 'For every 5 packs purchased, you get 1 pack FREE' },
  { free: '2 packs', text: 'For every 10 packs purchased, you get 2 packs FREE' },
  { free: '3 packs', text: 'For every 15 packs purchased, you get 3 packs FREE' },
  { free: '4 packs', text: 'For every 20 packs purchased, you get 4 packs FREE' },
]

export default function ProductDetail({ product }: { product: Product }) {
  const { addItem } = useCart()
  const { money } = useCurrency()
  const tiers = packTiers(parsePrice(product.price), product.packs)
  const { selected, tab, toastVisible } = useStore(componentUiStore, state => state.productDetail)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    componentUiStore.actions.resetProductDetail(product.slug)
  }, [product.slug])

  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
  }, [])

  const reviews = product.reviews ?? []
  const qa = product.qa ?? []

  function handleAdd() {
    const tier = tiers[selected]
    addItem({
      id: `${product.slug}__${tier.packs}`,
      productName: product.name,
      packCount: tier.packs,
      packLabel: tier.label,
      slug: product.slug,
      price: tier.total,
      qty: 1,
      image: product.images[0],
      brand: product.brand,
    })
    componentUiStore.actions.setProductToastVisible(true)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => componentUiStore.actions.setProductToastVisible(false), 2500)
  }

  return (
    <>
      <div className={`notification${toastVisible ? ' visible' : ''}`} aria-live="polite">
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
                  <img alt={product.name} className="img-fluid ngc-product-image" src={product.images[0]} />
                )}
              </div>
              <div className="label-group" />
            </div>
          </div>

          <div className="product-single-details col-lg-7 col-md-6">
            <h1 className="product-title">{product.name}</h1>

            {reviews.length > 0 && (
              <div className="ratings-container">
                <span className="rating-link">
                  <span className="count">({reviews.length}</span> reviews)
                </span>
              </div>
            )}
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
                      onChange={() => componentUiStore.actions.setProductPack(i)}
                    />
                    <label htmlFor={`pack_${t.packs}_${i}`} className="product-multipliers__item--info">
                      <div className="quantity">
                        {t.packs} pack{t.packs > 1 ? 's' : ''}{t.label ? `  (${t.label})` : ''}
                      </div>
                      <div className="price-per-item" data-label="Price per item">
                        {money(t.perItem)}
                      </div>
                      <div className="price-total" data-label="Total">{money(t.total)}</div>
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
            <li className="nav-item">
              <button
                type="button"
                className={`nav-link${tab === 'description' ? ' active' : ''}`}
                onClick={() => componentUiStore.actions.setProductTab('description')}
              >
                Description
              </button>
            </li>
            {qa.length > 0 && (
              <li className="nav-item">
                <button
                  type="button"
                  className={`nav-link${tab === 'qa' ? ' active' : ''}`}
                  onClick={() => componentUiStore.actions.setProductTab('qa')}
                >
                  Customer Questions &amp; Answers: {qa.length}
                </button>
              </li>
            )}
            {reviews.length > 0 && (
              <li className="nav-item">
                <button
                  type="button"
                  className={`nav-link nav-link-reviews${tab === 'reviews' ? ' active' : ''}`}
                  onClick={() => componentUiStore.actions.setProductTab('reviews')}
                >
                  Reviews: {reviews.length}
                </button>
              </li>
            )}
          </ul>
          <div className="tab-content" id="productContent">
            {tab === 'description' && (
              <div className="tab-pane active" id="description">
                <p style={{ whiteSpace: 'pre-line' }}>
                  {product.description || 'No description available.'}
                </p>
              </div>
            )}
            {tab === 'qa' && (
              <div className="tab-pane active" id="questions">
                <div className="product-customer-reviews-block">
                  {qa.map((item, i) => (
                    <div className="product-customer-post mb-0" key={i}>
                      <article className="card article-question article-post question">
                        <div className="question-content">
                          <div className="card-header question-header">
                            <div className="d-flex flex-row align-items-baseline">
                              <div className="post-author"><h4>{item.author}</h4></div>
                              <div className="post-meta">
                                <span className="post-date">Asked: <time className="entry-date published">{item.date}</time></span>
                              </div>
                            </div>
                          </div>
                          <div className="question-body card-body bg-gray">
                            <div className="text-body">{item.question}</div>
                          </div>
                        </div>
                      </article>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {tab === 'reviews' && (
              <div className="tab-pane active" id="reviews">
                <div className="product-review-list">
                  {reviews.map((rv, i) => (
                    <div className="product-review__item mb-3" key={i}>
                      <div className="product-review__item-content">
                        <div className="product-review__item-header">
                          <div className="rating me-2">
                            <div className="rating-stars" title={String(rv.rating)}>
                              {[1, 2, 3, 4, 5].map(n => (
                                <span
                                  key={n}
                                  className={`rating-stars-icon${n <= rv.rating ? ' active' : ''}`}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 24">
                                    <path d="M12.5,0c-0.5,0-1.1,0.3-1.3,0.8L8.1,7L1.3,8c-1.2,0.2-1.7,1.7-0.8,2.6l5,4.8l-1.2,6.8c-0.2,1,0.6,1.8,1.5,1.8c0.2,0,0.5-0.1,0.7-0.2l6.1-3.2l6.1,3.2c0.2,0.1,0.5,0.2,0.7,0.2c0.9,0,1.6-0.8,1.5-1.8l-1.2-6.8l5-4.8C25.5,9.7,25,8.2,23.8,8l-6.8-1l-3.1-6.2C13.6,0.3,13.1,0,12.5,0L12.5,0z" />
                                  </svg>
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="post-author"><h4>by {rv.author}</h4></div>
                          <div className="post-meta">
                            <div className="post-date">
                              <time className="entry-date published">Date Added: {rv.date}</time>
                            </div>
                          </div>
                        </div>
                        <div className="product-review__item-body">{rv.body}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
