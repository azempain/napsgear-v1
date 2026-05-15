import CartView from '@/components/CartView'

export const metadata = { title: 'Cart — NapsGear' }

export default function CartPage() {
  return (
    <main className="main">
      <div className="container py-5">
        <h1 className="mb-4">Cart Contents</h1>
        <CartView />
      </div>
    </main>
  )
}
