'use client'
import { useCart } from '@/context/CartContext'
import { subtotal, shippingFee, loyaltyCredit, total } from '@/lib/cart'

export default function CartView() {
  const { items, updateQty, removeItem, clearCart } = useCart()

  if (items.length === 0) {
    return (
      <div className="cart-empty py-5 text-center">
        <p className="text-muted mb-4">Your cart is empty</p>
        <a className="btn btn-outline-primary btn-sm" href="/catalog/">
          Continue Shopping
        </a>
      </div>
    )
  }

  return (
    <div className="cart-page">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="section-title m-0">Your cart</h2>
        <button type="button" className="btn btn-link text-danger p-0" onClick={clearCart}>
          Clear cart
        </button>
      </div>

      <table className="cart-table w-100">
        <thead>
          <tr>
            <th>Products</th>
            <th>Price</th>
            <th>Qty</th>
            <th>Total</th>
            <th aria-label="Remove" />
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr key={item.id}>
              <td>
                <div className="d-flex align-items-center gap-2">
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.name}
                      width={56}
                      height={56}
                      style={{ objectFit: 'contain' }}
                      referrerPolicy="no-referrer"
                    />
                  )}
                  <div>
                    <div className="fw-medium">{item.name}</div>
                    {item.brand && <small className="text-muted">{item.brand}</small>}
                  </div>
                </div>
              </td>
              <td>${item.price}</td>
              <td>
                <input
                  type="number"
                  min={0}
                  value={item.qty}
                  onChange={e => updateQty(item.id, Number(e.target.value))}
                  style={{ width: 64 }}
                  aria-label={`Quantity for ${item.name}`}
                />
              </td>
              <td>${item.price * item.qty}</td>
              <td>
                <button
                  type="button"
                  className="btn btn-link text-danger p-0"
                  onClick={() => removeItem(item.id)}
                  aria-label={`Remove ${item.name}`}
                >
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="cart-totals mt-4">
        <h3 className="section-title">Cart Totals</h3>
        <p className="text-success">
          You will earn ${loyaltyCredit(items)} of Loyalty Credit!
        </p>
        <div className="d-flex justify-content-between">
          <span>Order Subtotal:</span><span>${subtotal(items)}</span>
        </div>
        <div className="d-flex justify-content-between">
          <span>Shipping &amp; Handling:</span><span>${shippingFee(items)}</span>
        </div>
        <div className="d-flex justify-content-between">
          <span>Shipping Extra Fee:</span><span>$0</span>
        </div>
        <div className="d-flex justify-content-between fw-bold">
          <span>Total:</span><span>${total(items)}</span>
        </div>
        <div className="d-flex gap-2 mt-3">
          <a className="btn btn-outline-primary btn-sm" href="/catalog/">
            Continue Shopping
          </a>
          <button type="button" className="btn btn-primary btn-sm">
            Proceed to Checkout
          </button>
        </div>
      </div>
    </div>
  )
}
