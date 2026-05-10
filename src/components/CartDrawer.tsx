'use client'
import { useCart } from '@/context/CartContext'

export default function CartDrawer() {
  const { items, count, removeItem, updateQty } = useCart()

  return (
    <div id="shoppingCartBox" className="dropdown dropdown-cart">
      <div className="cart-overlay" data-cart-close="" />
      <div className="dropdown-menu mobile-cart">
        <div className="cart-close-overlay">
          <a href="#" title="Close (Esc)" className="btn-close cart-close" data-cart-close="" />
        </div>
        <div className="dropdownmenu-wrapper custom-scrollbar">
          <div className="dropdown-cart-header">Shopping Cart</div>

          {count === 0 ? (
            <p className="pt-3 mt-2">No products in the cart.</p>
          ) : (
            <>
              <ul className="cart-products">
                {items.map(item => (
                  <li key={item.id} className="cart-product">
                    {item.image && (
                      <figure className="product-image-container">
                        <img src={item.image} alt={item.name} width={80} height={80} />
                      </figure>
                    )}
                    <div className="product-details">
                      <h4 className="product-title">{item.name}</h4>
                      <div className="product-action">
                        <div className="product-qty">
                          <button
                            className="quantity-minus"
                            onClick={() => updateQty(item.id, item.qty - 1)}
                            aria-label="decrease quantity"
                          >&#8722;</button>
                          <span className="quantity">{item.qty}</span>
                          <button
                            className="quantity-plus"
                            onClick={() => updateQty(item.id, item.qty + 1)}
                            aria-label="increase quantity"
                          >&#43;</button>
                        </div>
                        <div className="product-price">
                          ${(item.price * item.qty).toFixed(2)}
                        </div>
                        <button
                          className="btn-remove"
                          onClick={() => removeItem(item.id)}
                          aria-label={`Remove ${item.name}`}
                        >&#215;</button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="dropdown-cart-total">
                <span>Total:</span>
                <span className="cart-total-price">
                  ${items.reduce((s, i) => s + i.price * i.qty, 0).toFixed(2)}
                </span>
              </div>
              <div className="dropdown-cart-action">
                <a href="/checkout" className="btn btn-primary btn-block">Checkout</a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
