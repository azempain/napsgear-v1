'use client'
import type { CartItem } from '@/context/CartContext'
import { subtotal, shippingFee, loyaltyCredit, total } from '@/lib/cart'
import { useCurrency } from '@/context/CurrencyContext'

export default function OrderSummary({ items }: { items: CartItem[] }) {
  const { money } = useCurrency()
  return (
    <aside className="ngc-totals" aria-label="Order summary">
      <div className="ngc-totals__card">
        <h3 className="ngc-totals__title">ORDER SUMMARY</h3>

        <ul className="ngc-summary__items">
          {items.map(i => (
            <li key={i.id} className="ngc-summary__item">
              <div className="ngc-summary__info">
                <span className="ngc-summary__name">{i.productName}</span>
                <span className="ngc-summary__variant">
                  {i.qty}&times; · {i.packCount} pack{i.packCount === 1 ? '' : 's'}
                  {i.packLabel ? ` · ${i.packLabel}` : ''}
                </span>
              </div>
              <span className="ngc-summary__price">{money(i.price * i.qty)}</span>
            </li>
          ))}
        </ul>

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
          <div data-order-total>{money(total(items))}</div>
        </div>
      </div>
    </aside>
  )
}
