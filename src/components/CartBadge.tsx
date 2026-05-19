'use client'
import { useCart } from '@/context/CartContext'
import Skeleton from './Skeleton'

export default function CartBadge() {
  const { count, hydrated } = useCart()
  // Until localStorage has been read, render a small skeleton dot inside the
  // badge instead of flashing "0" then the real count.
  if (!hydrated) {
    return (
      <span className="cart-count badge-circle" aria-label="Loading cart">
        <Skeleton className="ngc-cart-badge-skel" radius="50%" label="" />
      </span>
    )
  }
  return <span className="cart-count badge-circle">{count}</span>
}
