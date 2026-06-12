'use client'
import { useCart } from '@/context/CartContext'
import { useCurrency } from '@/context/CurrencyContext'
import Image from 'next/image'
import Link from 'next/link'

export default function CartDrawer() {
  const { items, count, removeItem, updateQty } = useCart()
  const { money } = useCurrency()

  return (
    <div id="shoppingCartBox" className="dropdown dropdown-cart">
      <div className="cart-overlay" data-cart-close="" />
      <div className="dropdown-menu mobile-cart">
        <div className="cart-close-overlay">
          <button type="button" title="Close (Esc)" aria-label="Close cart" className="btn-close cart-close" data-cart-close="" />
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
                        <Image src={item.image} alt={item.productName} width={80} height={80} unoptimized />
                      </figure>
                    )}
                    <div className="product-details">
                      <h4 className="product-title">{item.productName}</h4>
                      <div className="cart-product-variant">
                        {item.packCount} pack{item.packCount === 1 ? '' : 's'}
                        {item.packLabel ? ` · ${item.packLabel}` : ''}
                      </div>
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
                          {money(item.price * item.qty)}
                        </div>
                        <button
                          className="btn-remove"
                          onClick={() => removeItem(item.id)}
                          aria-label={`Remove ${item.productName}`}
                        >&#215;</button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="dropdown-cart-total">
                <span>Total:</span>
                <span className="cart-total-price">
                  {money(items.reduce((s, i) => s + i.price * i.qty, 0))}
                </span>
              </div>
              <div className="dropdown-cart-action">
                <Link href="/checkout/" className="btn btn-primary btn-block">Checkout</Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
