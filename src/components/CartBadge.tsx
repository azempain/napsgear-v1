'use client'
import { useCart } from '@/context/CartContext'
import Skeleton from './Skeleton'

export default function CartBadge() {
  const { count, hydrated } = useCart()
  // Until localStorage has been read, render a small skeleton dot inside the
  // badge instead of flashing "0" then the real count.
  if (!hydrated) {
    // Render the skeleton WITHOUT the legacy .cart-count.badge-circle wrapper —
    // that wrapper paints a red background + min-width that made the loading
    // state look like an empty red disc instead of a small shimmer dot.
    return (
      <Skeleton
        className="ngc-cart-badge-skel"
        width={18}
        height={18}
        radius="50%"
        label="Loading cart"
      />
    )
  }
  return <span className="cart-count badge-circle">{count}</span>
}
