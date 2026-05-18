'use client'
import { useState, useRef, useEffect } from 'react'
import { useCart } from '@/context/CartContext'
import { subtotal, shippingFee, loyaltyCredit, total } from '@/lib/cart'

const money = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

const TrashIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 105.7 122.88" aria-hidden="true">
    <path d="M30.46,14.57V5.22A5.18,5.18,0,0,1,32,1.55v0A5.19,5.19,0,0,1,35.68,0H70a5.22,5.22,0,0,1,3.67,1.53l0,0a5.22,5.22,0,0,1,1.53,3.67v9.35h27.08a3.36,3.36,0,0,1,3.38,3.37V29.58A3.38,3.38,0,0,1,102.32,33H98.51l-8.3,87.22a3,3,0,0,1-2.95,2.69H18.43a3,3,0,0,1-3-2.95L7.19,33H3.37A3.38,3.38,0,0,1,0,29.58V17.94a3.36,3.36,0,0,1,3.37-3.37Zm36.27,0V8.51H39v6.06ZM49.48,49.25a3.4,3.4,0,0,1,6.8,0v51.81a3.4,3.4,0,1,1-6.8,0V49.25ZM69.59,49a3.4,3.4,0,1,1,6.78.42L73,101.27a3.4,3.4,0,0,1-6.78-.43L69.59,49Zm-40.26.42A3.39,3.39,0,1,1,36.1,49l3.41,51.8a3.39,3.39,0,1,1-6.77.43L29.33,49.46ZM92.51,33.38H13.19l7.94,83.55H84.56l8-83.55Z" />
  </svg>
)

export default function CartView() {
  const { items, updateQty, removeItem, clearCart } = useCart()
  const [toast, setToast] = useState(false)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
  }, [])

  function handleRemove(id: string) {
    removeItem(id)
    setToast(true)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(false), 2500)
  }

  if (items.length === 0) {
    return (
      <>
        <nav className="ngc-crumbs" aria-label="Breadcrumb">
          <span className="ngc-crumbs__sep" aria-hidden="true">›</span>
          <span>CART CONTENTS</span>
        </nav>
        <div className="ngc-empty">
          <div className="ngc-empty__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="44" height="44" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 01-8 0" />
            </svg>
          </div>
          <h2 className="ngc-empty__title">Your cart is empty</h2>
          <p className="ngc-empty__sub">Looks like you haven&rsquo;t added anything yet.</p>
          <a className="ngc-btn ngc-btn--dark" href="/catalog/">Browse Catalog</a>
        </div>
      </>
    )
  }

  return (
    <>
      <div className={`notification${toast ? ' visible' : ''}`} aria-live="polite">
        <section className="body">
          <span className="title">Removed</span>
          <p className="message">Item removed from cart</p>
        </section>
      </div>

      <nav className="ngc-crumbs" aria-label="Breadcrumb">
        <span className="ngc-crumbs__sep" aria-hidden="true">›</span>
        <span>CART CONTENTS</span>
      </nav>

      <div className="ngc-page">
        <div className="ngc-content">
          <div className="ngc-head">
            <span>Your cart</span>
            <button type="button" className="ngc-clear" onClick={clearCart} title="Clear cart">
              <TrashIcon />
              Clear cart
            </button>
          </div>

          <div className="ngc-subhead">
            <div className="ngc-col-product">Products</div>
            <div className="ngc-col-price">Price</div>
            <div className="ngc-col-qty">Qty</div>
            <div className="ngc-col-total">Total</div>
            <div className="ngc-col-actions" aria-hidden="true"></div>
          </div>

          <div className="ngc-ofc">
            <div className="ngc-ofc__label">Shipping &amp; Handling</div>
            <div className="ngc-ofc__price">{money(shippingFee(items))}</div>
          </div>

          <div className="ngc-items">
            {items.map(item => {
              const lineTotal = item.price * item.qty
              return (
                <div key={item.id} className="ngc-item">
                  <div className="ngc-item__product">
                    <figure className="ngc-item__image">
                      {item.image ? (
                        <img src={item.image} alt={item.name} referrerPolicy="no-referrer" />
                      ) : (
                        <div className="ngc-item__placeholder" aria-hidden="true" />
                      )}
                    </figure>

                    <div className="ngc-item__details">
                      <h3 className="ngc-item__name"><a href="/catalog/">{item.name}</a></h3>
                      {item.brand && (
                        <div className="ngc-item__brand">{item.brand}</div>
                      )}
                    </div>
                  </div>

                  <div className="ngc-item__price" data-label="Price">{money(item.price)}</div>

                  <div className="ngc-item__qty" data-label="Qty">
                    <div className="ngc-stepper" role="group" aria-label={`Quantity for ${item.name}`}>
                      <button
                        type="button"
                        className="ngc-stepper__btn"
                        onClick={() => updateQty(item.id, item.qty - 1)}
                        aria-label="Decrease quantity"
                      >−</button>
                      <input
                        type="number"
                        min={1}
                        value={item.qty}
                        onChange={e => updateQty(item.id, Number(e.target.value))}
                        className="ngc-stepper__input"
                        aria-label={`Quantity for ${item.name}`}
                      />
                      <button
                        type="button"
                        className="ngc-stepper__btn"
                        onClick={() => updateQty(item.id, item.qty + 1)}
                        aria-label="Increase quantity"
                      >+</button>
                    </div>
                  </div>

                  <div className="ngc-item__total" data-label="Total">{money(lineTotal)}</div>

                  <div className="ngc-item__actions">
                    <button
                      type="button"
                      className="ngc-item__remove"
                      onClick={() => handleRemove(item.id)}
                      aria-label={`Remove ${item.name}`}
                      title="Remove Product"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <aside className="ngc-totals" aria-label="Order summary">
          <div className="ngc-totals__card">
            <h3 className="ngc-totals__title">CART TOTALS</h3>

            <div className="ngc-loyalty">
              You will earn <strong>{money(loyaltyCredit(items))}</strong> of Loyalty Credit!
            </div>

            <div className="ngc-totals__row">
              <h6>Order Subtotal:</h6>
              <div>{money(subtotal(items))}</div>
            </div>
            <div className="ngc-totals__row">
              <h6>Shipping &amp; Handling:</h6>
              <div>{money(shippingFee(items))}</div>
            </div>
            <div className="ngc-totals__row ngc-totals__row--grand">
              <h6>Total:</h6>
              <div>{money(total(items))}</div>
            </div>

            <div className="ngc-actions">
              <a className="ngc-btn ngc-btn--outline" href="/catalog/">Continue Shopping</a>
              <a className="ngc-btn ngc-btn--dark" href="/checkout/">
                Proceed to Checkout
              </a>
            </div>
          </div>
        </aside>
      </div>
    </>
  )
}
