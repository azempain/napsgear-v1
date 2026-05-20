import type { Metadata } from 'next'
import CartView from '@/components/CartView'

export const metadata: Metadata = {
  title: 'Cart',
  description: 'Your shopping cart.',
  robots: { index: false, follow: false },
  alternates: { canonical: '/cart/' },
}

export default function CartPage() {
  return (
    <main className="main cart-main">
      <div className="container">
        <CartView />
      </div>
    </main>
  )
}
