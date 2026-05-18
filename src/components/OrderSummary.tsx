'use client'
import type { CartItem } from '@/context/CartContext'
import { subtotal, shippingFee, loyaltyCredit, total } from '@/lib/cart'

const fmt = (n: number) => `$${n.toFixed(2)}`

export default function OrderSummary({ items }: { items: CartItem[] }) {
  return (
    <aside className="checkout-summary card border rounded p-3">
      <h2 className="section-title">Order Summary</h2>
      <ul className="checkout-summary__items list-unstyled m-0">
        {items.map(i => (
          <li key={i.id} className="d-flex justify-content-between py-2 border-bottom">
            <span>{i.qty}&times; {i.name}</span>
            <span className="fw-medium">{fmt(i.price * i.qty)}</span>
          </li>
        ))}
      </ul>
      <div className="d-flex justify-content-between pt-3">
        <span>Subtotal</span><span>{fmt(subtotal(items))}</span>
      </div>
      <div className="d-flex justify-content-between">
        <span>Shipping &amp; Handling</span><span>{fmt(shippingFee(items))}</span>
      </div>
      <div className="d-flex justify-content-between text-success">
        <span>You&apos;ll earn Loyalty Credit</span><span>{fmt(loyaltyCredit(items))}</span>
      </div>
      <div className="d-flex justify-content-between fw-bold fs-5 pt-2 border-top mt-2">
        <span>Total</span><span data-order-total>{fmt(total(items))}</span>
      </div>
    </aside>
  )
}
