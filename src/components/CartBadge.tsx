'use client'
import { useCart } from '@/context/CartContext'

export default function CartBadge() {
  const { count } = useCart()
  return <span className="cart-count badge-circle">{count}</span>
}
