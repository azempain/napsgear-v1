import CartView from '@/components/CartView'

export const metadata = { title: 'Cart — NapsGear' }

export default function CartPage() {
  return (
    <main className="main cart-main">
      <div className="container">
        <CartView />
      </div>
    </main>
  )
}
